-- ============================================================================
-- QUIZMANIA PRODUCTION MIGRATION: MULTI-DEVICE ADMIN SYNCHRONIZATION,
-- SHARED DATABASE STATE & SERVER-AUTHORITATIVE EXAMINATION ENGINE
-- Target: Supabase Cloud PostgreSQL 15+
--
-- NON-DESTRUCTIVE: Preserves all existing participants, attempts, and submissions.
--
-- Fixes:
-- 1. Multi-Device Admin Sessions: Introduces public.admin_sessions table so
--    multiple organizers (Laptop A, Laptop B, etc.) can log in concurrently using
--    'admin'/'admin123' without invalidating each other's session tokens.
-- 2. Authoritative Examination Lifecycle: Enhances public.competitions with
--    paused_at, remaining_time_when_paused, round_started_at, round_ended_at,
--    and state_version columns, plus 'paused' status support.
-- 3. Atomic Round Orchestration: Updates admin_update_competition_state to
--    atomically establish question_start_time, question_deadline, current_question_id,
--    and state_version on the server.
-- 4. Authoritative State Fetching: Updates get_competition_state_rpc to return
--    the full shared state (status, round, question, deadline, remaining seconds).
-- 5. Multi-Token Authorization: Updates admin_get_participants, admin_regenerate_student_access_code,
--    and admin_update_competition_state to authorize via admin_sessions or admin_users.
-- 6. Supabase Realtime Publication: Adds public.competitions to supabase_realtime.
-- ============================================================================

-- Step 1: Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create public.admin_sessions table for concurrent multi-device logins
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    token_expires_at TIMESTAMPTZ NOT NULL,
    ip_hint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(token_expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_sessions FROM anon, public;
GRANT ALL ON TABLE public.admin_sessions TO service_role;

-- Step 3: Enhance public.competitions with authoritative timing & versioning columns
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS remaining_time_when_paused INT;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS round_started_at TIMESTAMPTZ;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS round_ended_at TIMESTAMPTZ;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS state_version INT NOT NULL DEFAULT 1;

-- Safely update status check constraint to include 'paused'
DO $$
BEGIN
    ALTER TABLE public.competitions DROP CONSTRAINT IF EXISTS competitions_status_check;
    ALTER TABLE public.competitions ADD CONSTRAINT competitions_status_check 
        CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'results_published', 'paused'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- Step 4: Multi-Device Server-Side Administrator Login RPC
CREATE OR REPLACE FUNCTION public.admin_login_rpc(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_admin RECORD;
    v_token TEXT;
    v_expires TIMESTAMPTZ;
BEGIN
    IF p_username IS NULL OR p_password IS NULL OR trim(p_username) = '' OR trim(p_password) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username and password are required.');
    END IF;

    SELECT * INTO v_admin FROM public.admin_users 
    WHERE lower(username) = lower(trim(p_username));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid administrator credentials. Access denied.');
    END IF;

    -- Cryptographic verification using bcrypt
    IF v_admin.password_hash <> extensions.crypt(trim(p_password), v_admin.password_hash) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid administrator credentials. Access denied.');
    END IF;

    -- Generate cryptographically random 256-bit session token
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_expires := clock_timestamp() + INTERVAL '12 hours';

    -- Insert into admin_sessions: Allows multiple concurrent admin laptops without token collision
    INSERT INTO public.admin_sessions (user_id, session_token, token_expires_at)
    VALUES (v_admin.id, v_token, v_expires);

    -- Maintain admin_users backward compatibility
    UPDATE public.admin_users
    SET 
        session_token = v_token,
        token_expires_at = v_expires,
        last_login_at = clock_timestamp()
    WHERE id = v_admin.id;

    RETURN jsonb_build_object(
        'success', true,
        'token', v_token,
        'username', v_admin.username,
        'role', v_admin.role,
        'expires_at', (EXTRACT(EPOCH FROM v_expires) * 1000)::BIGINT
    );
END;
$$;

-- Step 5: Administrator Session Verification RPC (Multi-Token Compatible)
CREATE OR REPLACE FUNCTION public.verify_admin_session_rpc(
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_admin RECORD;
BEGIN
    IF p_token IS NULL OR trim(p_token) = '' THEN
        RETURN jsonb_build_object('is_admin', false, 'error', 'Missing session token.');
    END IF;

    -- 1. Check admin_sessions table
    SELECT u.username, u.role INTO v_admin
    FROM public.admin_sessions s
    JOIN public.admin_users u ON u.id = s.user_id
    WHERE s.session_token = trim(p_token) AND s.token_expires_at > clock_timestamp();

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_admin', true,
            'username', v_admin.username,
            'role', v_admin.role
        );
    END IF;

    -- 2. Fallback check admin_users table
    SELECT username, role INTO v_admin FROM public.admin_users 
    WHERE session_token = trim(p_token) AND token_expires_at > clock_timestamp();

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_admin', true,
            'username', v_admin.username,
            'role', v_admin.role
        );
    END IF;

    -- 3. Fallback: Supabase Auth check on admin_roles table
    IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
        RETURN jsonb_build_object('is_admin', true, 'username', 'admin', 'role', 'SUPERADMIN');
    END IF;

    RETURN jsonb_build_object('is_admin', false, 'error', 'Session expired or invalid.');
END;
$$;

-- Step 6: Administrator Logout RPC (Removes only this device's session)
CREATE OR REPLACE FUNCTION public.admin_logout_rpc(
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
BEGIN
    DELETE FROM public.admin_sessions WHERE session_token = trim(p_token);
    UPDATE public.admin_users SET session_token = NULL WHERE session_token = trim(p_token);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Step 7: Multi-Token Authorized Participant Management
DROP FUNCTION IF EXISTS public.admin_get_participants();
DROP FUNCTION IF EXISTS public.admin_get_participants(TEXT);

CREATE OR REPLACE FUNCTION public.admin_get_participants(
    p_admin_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_is_authorized BOOLEAN := false;
BEGIN
    -- Check multi-device admin session authorization
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_sessions WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
            v_is_authorized := true;
        ELSIF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    -- Check Supabase Auth uid authorization
    IF NOT v_is_authorized AND auth.uid() IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('error', 'Unauthorized: Valid administrator session required.');
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'competition_id', p.competition_id,
            'access_code', p.access_code,
            'student_name', p.student_name,
            'school_name', p.school_name,
            'student_class', p.student_class,
            'is_active', p.is_active,
            'created_at', p.created_at,
            'last_ping_at', p.last_ping_at,
            'round_1_submitted', COALESCE(ea1.is_submitted, false),
            'round_1_score', COALESCE(ea1.score, 0),
            'round_2_submitted', COALESCE(ea2.is_submitted, false),
            'round_2_score', COALESCE(ea2.score, 0),
            'is_qualified', COALESCE(ea1.is_qualified, false),
            'status', CASE 
                WHEN ea2.is_submitted THEN 'Round 2 Completed'
                WHEN ea2.id IS NOT NULL THEN 'Round 2 In Progress'
                WHEN ea1.is_submitted AND ea1.is_qualified THEN 'Qualified for Round 2'
                WHEN ea1.is_submitted AND NOT ea1.is_qualified THEN 'Round 1 Completed'
                WHEN ea1.id IS NOT NULL THEN 'Round 1 In Progress'
                ELSE 'Registered'
            END
        ) ORDER BY p.created_at ASC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.participants p
    LEFT JOIN public.exam_attempts ea1 ON ea1.participant_id = p.id AND ea1.round_number = 1
    LEFT JOIN public.exam_attempts ea2 ON ea2.participant_id = p.id AND ea2.round_number = 2;

    RETURN v_result;
END;
$$;

-- Step 8: Multi-Token Authorized Student Access Code Regeneration
CREATE OR REPLACE FUNCTION public.admin_regenerate_student_access_code(
    p_participant_id UUID,
    p_admin_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_is_authorized BOOLEAN := false;
    v_participant RECORD;
    v_new_code TEXT;
    v_new_token TEXT;
BEGIN
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_sessions WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
            v_is_authorized := true;
        ELSIF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized AND auth.uid() IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Valid administrator session required.');
    END IF;

    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Participant not found.');
    END IF;

    v_new_code := 'QZ-' || upper(substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6));
    v_new_token := encode(extensions.gen_random_bytes(32), 'hex');

    UPDATE public.participants
    SET access_code = v_new_code,
        session_token = v_new_token,
        last_ping_at = clock_timestamp()
    WHERE id = p_participant_id;

    RETURN jsonb_build_object(
        'success', true,
        'participant_id', p_participant_id,
        'student_name', v_participant.student_name,
        'access_code', v_new_code,
        'session_token', v_new_token
    );
END;
$$;

-- Step 9: Authoritative Competition State Orchestration RPC
DROP FUNCTION IF EXISTS public.admin_update_competition_state(TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.admin_update_competition_state(TEXT, INT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_update_competition_state(
    p_status TEXT,
    p_round_number INT DEFAULT 1,
    p_cutoff INT DEFAULT 60,
    p_admin_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_comp RECORD;
    v_is_authorized BOOLEAN := false;
    v_first_q_id TEXT;
    v_duration INT;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_start_time TIMESTAMPTZ;
    v_deadline TIMESTAMPTZ;
    v_paused_at TIMESTAMPTZ;
    v_remaining INT;
    v_round_ended_at TIMESTAMPTZ;
    v_round_started_at TIMESTAMPTZ;
    v_q_number INT;
    v_q_id TEXT;
BEGIN
    -- Check admin token authorization across all active sessions
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_sessions WHERE session_token = trim(p_admin_token) AND token_expires_at > v_now) THEN
            v_is_authorized := true;
        ELSIF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > v_now) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    -- Check Supabase Auth uid authorization
    IF NOT v_is_authorized AND auth.uid() IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Valid administrator session required.');
    END IF;

    SELECT * INTO v_comp FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
    END IF;

    v_duration := COALESCE(v_comp.duration_per_question, 20);

    -- Establish question transitions based on status
    IF p_status = 'in_progress' THEN
        -- Case A: Starting or Resuming round
        IF v_comp.status = 'paused' AND v_comp.remaining_time_when_paused IS NOT NULL THEN
            -- Resuming from pause: Restore remaining countdown
            v_start_time := v_now;
            v_deadline := v_now + (GREATEST(1, v_comp.remaining_time_when_paused) || ' seconds')::INTERVAL;
            v_paused_at := NULL;
            v_remaining := NULL;
            v_round_started_at := v_comp.round_started_at;
            v_q_number := COALESCE(v_comp.current_question_number, 1);
            v_q_id := v_comp.current_question_id;
        ELSE
            -- Fresh round start
            SELECT id INTO v_first_q_id FROM public.questions 
            WHERE round_number = p_round_number 
            ORDER BY question_number ASC LIMIT 1;

            v_start_time := v_now;
            v_deadline := v_now + (v_duration || ' seconds')::INTERVAL;
            v_paused_at := NULL;
            v_remaining := NULL;
            v_round_started_at := v_now;
            v_q_number := 1;
            v_q_id := v_first_q_id;
        END IF;
        v_round_ended_at := NULL;

    ELSIF p_status = 'paused' THEN
        -- Pausing active countdown
        v_paused_at := v_now;
        v_remaining := GREATEST(0, EXTRACT(EPOCH FROM (v_comp.question_deadline - v_now))::INT);
        v_start_time := v_comp.question_start_time;
        v_deadline := v_comp.question_deadline;
        v_round_started_at := v_comp.round_started_at;
        v_round_ended_at := NULL;
        v_q_number := v_comp.current_question_number;
        v_q_id := v_comp.current_question_id;

    ELSIF p_status IN ('completed', 'registration_closed', 'results_published') THEN
        -- Concluding round
        v_round_ended_at := v_now;
        v_start_time := NULL;
        v_deadline := NULL;
        v_paused_at := NULL;
        v_remaining := NULL;
        v_round_started_at := v_comp.round_started_at;
        v_q_number := v_comp.current_question_number;
        v_q_id := NULL;
    ELSE
        -- Other status transitions (e.g. registration_open)
        v_start_time := NULL;
        v_deadline := NULL;
        v_paused_at := NULL;
        v_remaining := NULL;
        v_round_started_at := NULL;
        v_round_ended_at := NULL;
        v_q_number := 0;
        v_q_id := NULL;
    END IF;

    UPDATE public.competitions
    SET 
        status = p_status,
        current_round_number = COALESCE(p_round_number, current_round_number),
        round_1_qualifying_score = COALESCE(p_cutoff, round_1_qualifying_score),
        current_question_id = v_q_id,
        current_question_number = v_q_number,
        question_start_time = v_start_time,
        question_deadline = v_deadline,
        paused_at = v_paused_at,
        remaining_time_when_paused = v_remaining,
        round_started_at = v_round_started_at,
        round_ended_at = v_round_ended_at,
        state_version = COALESCE(v_comp.state_version, 0) + 1,
        updated_at = v_now
    WHERE id = v_comp.id
    RETURNING * INTO v_comp;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_comp.id,
        'code', v_comp.code,
        'status', v_comp.status,
        'current_round_number', v_comp.current_round_number,
        'current_question_id', v_comp.current_question_id,
        'current_question_number', v_comp.current_question_number,
        'question_start_time', v_comp.question_start_time,
        'question_deadline', v_comp.question_deadline,
        'round_1_qualifying_score', v_comp.round_1_qualifying_score,
        'state_version', v_comp.state_version,
        'server_time', (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT
    );
END;
$$;

-- Step 10: Complete Authoritative Competition State Fetcher RPC
CREATE OR REPLACE FUNCTION public.get_competition_state_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_comp RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_remaining INT := 0;
BEGIN
    SELECT * INTO v_comp FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
    END IF;

    IF v_comp.status = 'in_progress' AND v_comp.question_deadline IS NOT NULL THEN
        v_remaining := GREATEST(0, EXTRACT(EPOCH FROM (v_comp.question_deadline - v_now))::INT);
    ELSIF v_comp.status = 'paused' AND v_comp.remaining_time_when_paused IS NOT NULL THEN
        v_remaining := v_comp.remaining_time_when_paused;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_comp.id,
        'code', v_comp.code,
        'title', v_comp.title,
        'description', v_comp.description,
        'status', v_comp.status,
        'current_round_number', v_comp.current_round_number,
        'current_question_id', v_comp.current_question_id,
        'current_question_number', v_comp.current_question_number,
        'question_start_time', v_comp.question_start_time,
        'question_deadline', v_comp.question_deadline,
        'duration_per_question', v_comp.duration_per_question,
        'auto_advance', v_comp.auto_advance,
        'round_1_qualifying_score', COALESCE(v_comp.round_1_qualifying_score, 60),
        'state_version', COALESCE(v_comp.state_version, 1),
        'time_remaining_seconds', v_remaining,
        'server_time', (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT
    );
END;
$$;

-- Step 11: Leaderboard Fetcher with Fallback to Canonical Active Competition
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_competition_id UUID DEFAULT NULL)
RETURNS TABLE (
    rank BIGINT,
    participant_id UUID,
    student_name TEXT,
    school_name TEXT,
    student_class TEXT,
    round_1_score BIGINT,
    round_1_max_marks BIGINT,
    round_1_pct NUMERIC,
    round_2_score BIGINT,
    round_2_max_marks BIGINT,
    round_2_pct NUMERIC,
    total_score BIGINT,
    total_max_marks BIGINT,
    total_pct NUMERIC,
    total_time_ms BIGINT,
    correct_count BIGINT,
    is_qualified BOOLEAN,
    qualified_for_round_2 BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_cid UUID := p_competition_id;
BEGIN
    IF v_cid IS NULL THEN
        SELECT id INTO v_cid FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    END IF;

    RETURN QUERY
    WITH participant_scores AS (
        SELECT 
            p.id AS p_id,
            p.student_name AS p_name,
            p.school_name AS p_school,
            p.student_class::TEXT AS p_class,
            COALESCE(SUM(CASE WHEN s.round_number = 1 THEN s.points_awarded ELSE 0 END), 0) AS r1_score,
            COALESCE(SUM(CASE WHEN s.round_number = 2 THEN s.points_awarded ELSE 0 END), 0) AS r2_score,
            COALESCE(SUM(s.points_awarded), 0) AS t_score,
            COALESCE(SUM(CASE WHEN s.is_correct THEN s.latency_ms ELSE 0 END), 0) AS t_time,
            COALESCE(COUNT(CASE WHEN s.is_correct THEN 1 END), 0) AS c_count
        FROM public.participants p
        LEFT JOIN public.submissions s ON p.id = s.participant_id
        WHERE p.competition_id = v_cid OR v_cid IS NULL
        GROUP BY p.id, p.student_name, p.school_name, p.student_class
    )
    SELECT 
        DENSE_RANK() OVER (
            ORDER BY 
                ps.t_score DESC,
                ps.r2_score DESC,
                ps.t_time ASC
        ) AS rank,
        ps.p_id AS participant_id,
        ps.p_name AS student_name,
        ps.p_school AS school_name,
        ps.p_class AS student_class,
        ps.r1_score AS round_1_score,
        100::BIGINT AS round_1_max_marks,
        ROUND((ps.r1_score::NUMERIC / 100.0) * 100.0, 1) AS round_1_pct,
        ps.r2_score AS round_2_score,
        100::BIGINT AS round_2_max_marks,
        ROUND((ps.r2_score::NUMERIC / 100.0) * 100.0, 1) AS round_2_pct,
        ps.t_score AS total_score,
        200::BIGINT AS total_max_marks,
        ROUND((ps.t_score::NUMERIC / 200.0) * 100.0, 1) AS total_pct,
        ps.t_time AS total_time_ms,
        ps.c_count AS correct_count,
        (ps.r1_score >= 60) AS is_qualified,
        (ps.r1_score >= 60) AS qualified_for_round_2
    FROM participant_scores ps
    ORDER BY rank ASC, ps.p_name ASC;
END;
$$;

-- Step 12: Configure Supabase Realtime Replication Publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- Step 13: Grants for all execution tiers
GRANT EXECUTE ON FUNCTION public.admin_login_rpc(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_session_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_logout_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_participants(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_student_access_code(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_competition_state(TEXT, INT, INT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_competition_state_rpc() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID) TO anon, authenticated, service_role;
