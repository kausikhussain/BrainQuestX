-- ============================================================================
-- QUIZMANIA PRODUCTION MIGRATION: FIX ADMIN LOGIN & STUDENT ACCESS RECOVERY
-- Target: Supabase Cloud PostgreSQL 15+
--
-- Fixes:
-- 1. HTTP 300 Multiple Choices: Drops all overloaded variants of admin_get_participants
--    and admin_update_competition_state.
-- 2. Ensures admin_users table exists and seeds 'admin' / 'admin123' (bcrypt hashed).
-- 3. Implements admin_get_participants returning access_code and participation status.
-- 4. Implements admin_regenerate_student_access_code to safely regenerate credentials
--    without deleting registrations or resetting exam attempts.
-- 5. Implements admin_login_rpc, verify_admin_session_rpc, and admin_logout_rpc.
-- ============================================================================

-- Step 1: Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Ensure admin_users table exists with RLS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SUPERADMIN',
    session_token TEXT,
    token_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_users FROM anon, public;
GRANT ALL ON TABLE public.admin_users TO service_role;

-- Step 3: Seed 'admin' organizer credentials with bcrypt hashing
INSERT INTO public.admin_users (username, password_hash, role)
VALUES (
    'admin', 
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)), 
    'SUPERADMIN'
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    role = 'SUPERADMIN';

-- Step 4: Server-Side Administrator Login RPC
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

-- Step 5: Server-Side Administrator Session Verification RPC
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

    SELECT * INTO v_admin FROM public.admin_users 
    WHERE session_token = trim(p_token) AND token_expires_at > clock_timestamp();

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_admin', true,
            'username', v_admin.username,
            'role', v_admin.role
        );
    END IF;

    -- Fallback: Supabase Auth check on admin_roles table
    IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()) THEN
        RETURN jsonb_build_object('is_admin', true, 'username', 'admin', 'role', 'SUPERADMIN');
    END IF;

    RETURN jsonb_build_object('is_admin', false, 'error', 'Session expired or invalid.');
END;
$$;

-- Step 6: Server-Side Administrator Logout RPC
CREATE OR REPLACE FUNCTION public.admin_logout_rpc(
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
BEGIN
    UPDATE public.admin_users
    SET session_token = NULL, token_expires_at = NULL
    WHERE session_token = trim(p_token);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Step 7: Resolve HTTP 300 by explicitly dropping all overloads of admin_get_participants
DROP FUNCTION IF EXISTS public.admin_get_participants();
DROP FUNCTION IF EXISTS public.admin_get_participants(TEXT);

-- Step 8: Unified Administrator Get Participants with Access Codes & Status
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
    -- Check admin token authorization
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
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

-- Step 9: Administrator-Only Student Access Code Regeneration
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
    -- Check admin token authorization
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
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

    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Participant not found.');
    END IF;

    -- Generate new cryptographically random access code and session token
    v_new_code := 'QZ-' || upper(substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6));
    v_new_token := encode(extensions.gen_random_bytes(32), 'hex');

    -- Update participant credentials safely preserving ID, registration, exam attempts, and submissions
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

-- Step 10: Resolve HTTP 300 on admin_update_competition_state
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
BEGIN
    -- Check admin token authorization
    IF p_admin_token IS NOT NULL AND trim(p_admin_token) <> '' THEN
        IF EXISTS (SELECT 1 FROM public.admin_users WHERE session_token = trim(p_admin_token) AND token_expires_at > clock_timestamp()) THEN
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

    UPDATE public.competitions
    SET 
        status = COALESCE(p_status, status),
        current_round_number = COALESCE(p_round_number, current_round_number),
        round_1_qualifying_score = COALESCE(p_cutoff, round_1_qualifying_score),
        updated_at = clock_timestamp()
    WHERE id = v_comp.id
    RETURNING * INTO v_comp;

    RETURN jsonb_build_object(
        'success', true,
        'status', v_comp.status,
        'current_round_number', v_comp.current_round_number,
        'round_1_qualifying_score', v_comp.round_1_qualifying_score
    );
END;
$$;

-- Step 11: Permissions Grants
GRANT EXECUTE ON FUNCTION public.admin_login_rpc(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_session_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_logout_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_participants(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_student_access_code(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_competition_state(TEXT, INT, INT, TEXT) TO anon, authenticated, service_role;
