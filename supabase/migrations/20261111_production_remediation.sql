-- ============================================================================
-- QUIZMANIA PRODUCTION REMEDIATION: SECURITY HARDENING, ATTEMPT REGISTRY,
-- SERVER-SIDE SCORING & ADMIN RBAC (STEP 3)
-- Target: PostgreSQL 14+ / Supabase Cloud
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXAM ATTEMPTS TABLE (Authoritative Centralized Attempt Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number IN (1, 2)),
    start_time TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    duration_seconds INT NOT NULL DEFAULT 200,
    is_submitted BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ,
    score INT NOT NULL DEFAULT 0,
    max_marks INT NOT NULL DEFAULT 100,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_qualified BOOLEAN NOT NULL DEFAULT false,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    time_taken_seconds INT NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    answer_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    fullscreen_exit_count INT NOT NULL DEFAULT 0,
    fullscreen_exits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_participant_round_attempt UNIQUE (participant_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_participant ON public.exam_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_comp_round ON public.exam_attempts(competition_id, round_number);

-- ----------------------------------------------------------------------------
-- 2. ADMIN ROLES TABLE (Supabase Auth RBAC Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER', 'SUPERADMIN', 'admin', 'organizer', 'superadmin')),
    email TEXT,
    granted_by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY: HARDENED POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 3.1 Competitions Policies
DROP POLICY IF EXISTS "Public can view competitions" ON public.competitions;
CREATE POLICY "Public can view competitions"
    ON public.competitions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages competitions" ON public.competitions;
CREATE POLICY "Service role manages competitions"
    ON public.competitions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.2 Rounds Policies
DROP POLICY IF EXISTS "Public can view rounds" ON public.rounds;
CREATE POLICY "Public can view rounds"
    ON public.rounds FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages rounds" ON public.rounds;
CREATE POLICY "Service role manages rounds"
    ON public.rounds FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.3 Questions Policies
DROP POLICY IF EXISTS "Public can view questions" ON public.questions;
CREATE POLICY "Public can view questions"
    ON public.questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages questions" ON public.questions;
CREATE POLICY "Service role manages questions"
    ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.4 Question Options Policies (PROTECTED ANSWER KEYS: ZERO LEAKAGE)
-- Direct SELECT revoked from public. Public queries through v_client_questions!
REVOKE SELECT ON TABLE public.question_options FROM anon, authenticated;
GRANT SELECT ON TABLE public.question_options TO service_role;

DROP POLICY IF EXISTS "Admins can view question options" ON public.question_options;
CREATE POLICY "Admins can view question options"
    ON public.question_options FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

GRANT SELECT ON TABLE public.v_client_questions TO anon, authenticated, service_role;

-- 3.5 Participants Policies
DROP POLICY IF EXISTS "Admins can view participants" ON public.participants;
CREATE POLICY "Admins can view participants"
    ON public.participants FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages participants" ON public.participants;
CREATE POLICY "Service role manages participants"
    ON public.participants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.6 Submissions Policies
DROP POLICY IF EXISTS "Admins can view submissions" ON public.submissions;
CREATE POLICY "Admins can view submissions"
    ON public.submissions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages submissions" ON public.submissions;
CREATE POLICY "Service role manages submissions"
    ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.7 Exam Attempts Policies (FIXED: ZERO PUBLIC/ANON SNOOPING)
-- Remove any legacy wide-open policy:
DROP POLICY IF EXISTS "Participants can view their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON public.exam_attempts;

-- Only authenticated administrators or service_role can query attempts directly.
-- Candidates access their own attempt strictly through SECURITY DEFINER RPCs!
CREATE POLICY "Admins can view all exam attempts"
    ON public.exam_attempts FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages exam attempts" ON public.exam_attempts;
CREATE POLICY "Service role manages exam attempts"
    ON public.exam_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3.8 Admin Roles Policies
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;
CREATE POLICY "Users can view their own admin role"
    ON public.admin_roles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages admin roles" ON public.admin_roles;
CREATE POLICY "Service role manages admin roles"
    ON public.admin_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. SERVER-AUTHORITATIVE RPC: REGISTER PARTICIPANT
-- Exact signature matching frontend call:
-- p_competition_code, p_student_name, p_school_name, p_student_class
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_participant(
    p_competition_code TEXT,
    p_student_name TEXT,
    p_school_name TEXT,
    p_student_class TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_comp RECORD;
    v_clean_name TEXT;
    v_clean_school TEXT;
    v_code TEXT;
    v_participant_id UUID;
    v_existing RECORD;
BEGIN
    -- 1. Input sanitization
    v_clean_name := trim(p_student_name);
    v_clean_school := trim(p_school_name);
    
    IF v_clean_name = '' OR v_clean_school = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student name and school name are required.');
    END IF;

    IF p_student_class NOT IN ('11th', '12th') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Class must be either 11th or 12th.');
    END IF;

    -- 2. Resolve competition by code (or fallback to active competition)
    SELECT * INTO v_comp FROM public.competitions WHERE code = p_competition_code;
    IF NOT FOUND THEN
        SELECT * INTO v_comp FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Auto-bootstrap default competition if table was uninitialized
    IF v_comp IS NULL OR v_comp.id IS NULL THEN
        INSERT INTO public.competitions (
            id, code, title, description, status, current_round_number, duration_per_question, auto_advance
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            COALESCE(p_competition_code, 'QUIZ-2026'),
            'Inter-School Technical Quiz Competition 2026',
            'Technical Quiz Competition for Class 11th & 12th students',
            'registration_open',
            1,
            20,
            true
        )
        RETURNING * INTO v_comp;
    END IF;

    -- 3. Graceful Re-entry Guarantee: Check for existing participant first!
    -- If a registered candidate refreshes, reconnects, or re-enters, ALWAYS return existing credentials
    SELECT * INTO v_existing FROM public.participants 
    WHERE competition_id = v_comp.id 
      AND lower(student_name) = lower(v_clean_name) 
      AND lower(school_name) = lower(v_clean_school)
      AND student_class = p_student_class;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'participant_id', v_existing.id,
            'access_code', v_existing.access_code,
            'student_name', v_existing.student_name,
            'school_name', v_existing.school_name,
            'student_class', v_existing.student_class,
            'message', 'Welcome back! Restored your existing registration.'
        );
    END IF;

    -- 4. For new candidates, verify registration status
    IF v_comp.status NOT IN ('registration_open', 'upcoming', 'in_progress') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration for this competition is closed by the administrator.');
    END IF;

    -- 5. Generate unique access code e.g. QZ-F892A1
    v_code := 'QZ-' || UPPER(SUBSTRING(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6));

    INSERT INTO public.participants (competition_id, access_code, student_name, school_name, student_class)
    VALUES (v_comp.id, v_code, v_clean_name, v_clean_school, p_student_class)
    RETURNING id INTO v_participant_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'participant_id', v_participant_id,
        'access_code', v_code,
        'student_name', v_clean_name,
        'school_name', v_clean_school,
        'student_class', p_student_class,
        'message', 'Registration confirmed! Proceeding to waiting room.'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. SERVER-AUTHORITATIVE RPC: START OR RESTORE EXAM ATTEMPT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_or_restore_attempt(
    p_participant_id UUID,
    p_round_number INT,
    p_initial_question_order JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_comp RECORD;
    v_attempt RECORD;
    v_round1_attempt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_duration INT := 200; -- 10 questions * 20 seconds
BEGIN
    -- 1. Validate participant
    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid participant ID.');
    END IF;

    -- 2. Validate competition state
    SELECT * INTO v_comp FROM public.competitions WHERE id = v_participant.competition_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found.');
    END IF;

    -- 3. Strict Round 2 Qualification Gate
    IF p_round_number = 2 THEN
        SELECT * INTO v_round1_attempt FROM public.exam_attempts 
        WHERE participant_id = p_participant_id AND round_number = 1;
        
        IF NOT FOUND OR NOT v_round1_attempt.is_qualified THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Round 2 Access Denied: Candidate must qualify in Round 1 (General Paper) with at least 60% marks.'
            );
        END IF;
    END IF;

    -- 4. Check for existing attempt (Restore on reload/reconnect without timer reset or reshuffle)
    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_restored', true,
            'attempt_id', v_attempt.id,
            'participant_id', v_attempt.participant_id,
            'round_number', v_attempt.round_number,
            'start_time', (EXTRACT(EPOCH FROM v_attempt.start_time) * 1000)::BIGINT,
            'duration_seconds', v_attempt.duration_seconds,
            'is_submitted', v_attempt.is_submitted,
            'submitted_at', v_attempt.submitted_at,
            'answers', v_attempt.answers,
            'question_order', v_attempt.question_order,
            'fullscreen_exit_count', v_attempt.fullscreen_exit_count,
            'score', v_attempt.score,
            'max_marks', v_attempt.max_marks,
            'is_qualified', v_attempt.is_qualified
        );
    END IF;

    -- 5. Create new authoritative attempt
    INSERT INTO public.exam_attempts (
        competition_id,
        participant_id,
        round_number,
        start_time,
        duration_seconds,
        is_submitted,
        answers,
        question_order
    ) VALUES (
        v_comp.id,
        p_participant_id,
        p_round_number,
        v_now,
        v_duration,
        false,
        '{}'::jsonb,
        p_initial_question_order
    )
    RETURNING * INTO v_attempt;

    RETURN jsonb_build_object(
        'success', true,
        'is_restored', false,
        'attempt_id', v_attempt.id,
        'participant_id', v_attempt.participant_id,
        'round_number', v_attempt.round_number,
        'start_time', (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT,
        'duration_seconds', v_duration,
        'is_submitted', false,
        'answers', '{}'::jsonb,
        'question_order', p_initial_question_order,
        'fullscreen_exit_count', 0
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. SERVER-AUTHORITATIVE RPC: SAVE CANDIDATE ANSWER ATOMICALLY
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_attempt_answer(
    p_participant_id UUID,
    p_round_number INT,
    p_question_id TEXT,
    p_option_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_deadline TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active attempt found.');
    END IF;

    IF v_attempt.is_submitted THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attempt already submitted and finalized.');
    END IF;

    -- Overall attempt deadline check (nominal duration + 10s network grace buffer)
    v_deadline := v_attempt.start_time + (v_attempt.duration_seconds || ' seconds')::INTERVAL + INTERVAL '10 seconds';
    IF v_now > v_deadline THEN
        RETURN jsonb_build_object('success', false, 'is_expired', true, 'error', 'Overall examination time expired.');
    END IF;

    -- Update answers JSONB and record authoritative server timestamp
    UPDATE public.exam_attempts
    SET 
        answers = jsonb_set(COALESCE(answers, '{}'::jsonb), ARRAY[p_question_id], to_jsonb(p_option_id)),
        answer_timestamps = jsonb_set(COALESCE(answer_timestamps, '{}'::jsonb), ARRAY[p_question_id], to_jsonb(EXTRACT(EPOCH FROM v_now))),
        updated_at = v_now
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object('success', true, 'is_expired', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. SERVER-AUTHORITATIVE RPC: SUBMIT & EVALUATE EXAM ATTEMPT
-- Evaluates score against protected public.question_options table
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_exam_attempt_rpc(
    p_participant_id UUID,
    p_round_number INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_comp RECORD;
    v_q RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_max_marks INT := 100;
    v_score INT := 0;
    v_correct_count INT := 0;
    v_incorrect_count INT := 0;
    v_unanswered_count INT := 0;
    v_selected_opt_id TEXT;
    v_is_correct BOOLEAN;
    v_points INT;
    v_time_taken INT;
    v_percentage NUMERIC(5, 2);
    v_is_qualified BOOLEAN := false;
BEGIN
    -- 1. Find attempt
    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active examination attempt found.');
    END IF;

    IF v_attempt.is_submitted THEN
        -- Return already calculated score idempotently
        RETURN jsonb_build_object(
            'success', true,
            'already_submitted', true,
            'score', v_attempt.score,
            'max_marks', v_attempt.max_marks,
            'percentage', v_attempt.percentage,
            'is_qualified', v_attempt.is_qualified,
            'correct_count', v_attempt.correct_count,
            'incorrect_count', v_attempt.incorrect_count,
            'unanswered_count', v_attempt.unanswered_count,
            'time_taken_seconds', v_attempt.time_taken_seconds
        );
    END IF;

    -- 2. Iterate over questions for this round and score against question_options
    FOR v_q IN 
        SELECT q.id, q.points, qo.id AS correct_opt_id 
        FROM public.questions q
        JOIN public.question_options qo ON q.id = qo.question_id AND qo.is_correct = true
        WHERE q.round_number = p_round_number
        ORDER BY q.question_number ASC
    LOOP
        v_selected_opt_id := v_attempt.answers->>v_q.id;

        IF v_selected_opt_id IS NULL OR v_selected_opt_id = '' THEN
            v_unanswered_count := v_unanswered_count + 1;
        ELSE
            IF v_selected_opt_id = v_q.correct_opt_id THEN
                v_is_correct := true;
                v_points := COALESCE(v_q.points, 10);
                v_score := v_score + v_points;
                v_correct_count := v_correct_count + 1;
            ELSE
                v_is_correct := false;
                v_points := 0;
                v_incorrect_count := v_incorrect_count + 1;
            END IF;

            -- Record each evaluated response into public.submissions table
            INSERT INTO public.submissions (
                competition_id,
                round_number,
                question_id,
                participant_id,
                selected_option_id,
                is_correct,
                points_awarded,
                latency_ms,
                server_received_at
            ) VALUES (
                v_attempt.competition_id,
                p_round_number,
                v_q.id,
                p_participant_id,
                v_selected_opt_id,
                v_is_correct,
                v_points,
                0,
                v_now
            )
            ON CONFLICT (question_id, participant_id) 
            DO UPDATE SET 
                selected_option_id = EXCLUDED.selected_option_id,
                is_correct = EXCLUDED.is_correct,
                points_awarded = EXCLUDED.points_awarded,
                server_received_at = EXCLUDED.server_received_at;
        END IF;
    END LOOP;

    -- 3. Calculate timing and qualifications
    v_time_taken := GREATEST(1, LEAST(v_attempt.duration_seconds, EXTRACT(EPOCH FROM (v_now - v_attempt.start_time))::INT));
    v_percentage := ROUND((v_score::NUMERIC / v_max_marks::NUMERIC) * 100.0, 2);
    v_is_qualified := (v_score >= 60);

    -- 4. Mark attempt finalized
    UPDATE public.exam_attempts
    SET
        is_submitted = true,
        submitted_at = v_now,
        score = v_score,
        max_marks = v_max_marks,
        percentage = v_percentage,
        is_qualified = v_is_qualified,
        correct_count = v_correct_count,
        incorrect_count = v_incorrect_count,
        unanswered_count = v_unanswered_count,
        time_taken_seconds = v_time_taken,
        updated_at = v_now
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object(
        'success', true,
        'already_submitted', false,
        'score', v_score,
        'max_marks', v_max_marks,
        'percentage', v_percentage,
        'is_qualified', v_is_qualified,
        'correct_count', v_correct_count,
        'incorrect_count', v_incorrect_count,
        'unanswered_count', v_unanswered_count,
        'time_taken_seconds', v_time_taken
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. SERVER-AUTHORITATIVE RPC: SUBMIT SINGLE STUDENT ANSWER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_student_answer(
    p_participant_id UUID,
    p_question_id TEXT,
    p_selected_option_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_comp RECORD;
    v_participant RECORD;
    v_opt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_latency INT := 0;
    v_is_correct BOOLEAN := false;
    v_points INT := 0;
    v_existing RECORD;
BEGIN
    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid participant ID.');
    END IF;

    SELECT * INTO v_comp FROM public.competitions WHERE id = v_participant.competition_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found.');
    END IF;

    -- Check duplicate submission (Idempotency)
    SELECT * INTO v_existing FROM public.submissions 
    WHERE question_id = p_question_id AND participant_id = p_participant_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_submitted', true, 'message', 'Response already recorded.');
    END IF;

    -- Server scoring against question_options
    SELECT * INTO v_opt FROM public.question_options 
    WHERE id = p_selected_option_id AND question_id = p_question_id;

    IF FOUND AND v_opt.is_correct THEN
        v_is_correct := true;
        v_points := 10;
    END IF;

    INSERT INTO public.submissions (
        competition_id, round_number, question_id, participant_id,
        selected_option_id, is_correct, points_awarded, latency_ms, server_received_at
    ) VALUES (
        v_comp.id, COALESCE(v_comp.current_round_number, 1), p_question_id, p_participant_id,
        p_selected_option_id, v_is_correct, v_points, v_latency, v_now
    )
    ON CONFLICT (question_id, participant_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'already_submitted', false, 'received_at', v_now);
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. FULLSCREEN TELEMETRY RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_fullscreen_event(
    p_participant_id UUID,
    p_round_number INT,
    p_event_type TEXT,
    p_timestamp BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_new_event JSONB;
BEGIN
    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attempt not found.');
    END IF;

    v_new_event := jsonb_build_object('type', p_event_type, 'timestamp', p_timestamp);

    UPDATE public.exam_attempts
    SET 
        fullscreen_exit_count = CASE WHEN p_event_type = 'exit' THEN fullscreen_exit_count + 1 ELSE fullscreen_exit_count END,
        fullscreen_exits = COALESCE(fullscreen_exits, '[]'::jsonb) || v_new_event,
        updated_at = clock_timestamp()
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. DETERMINISTIC LEADERBOARD RPC
-- Returns all fields matching frontend LeaderboardEntry interface
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_competition_id UUID)
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
LANGUAGE sql
STABLE
AS $$
    WITH participant_scores AS (
        SELECT 
            p.id AS participant_id,
            p.student_name,
            p.school_name,
            p.student_class,
            COALESCE(SUM(CASE WHEN s.round_number = 1 THEN s.points_awarded ELSE 0 END), 0) AS round_1_score,
            COALESCE(SUM(CASE WHEN s.round_number = 2 THEN s.points_awarded ELSE 0 END), 0) AS round_2_score,
            COALESCE(SUM(s.points_awarded), 0) AS total_score,
            COALESCE(SUM(CASE WHEN s.is_correct THEN s.latency_ms ELSE 0 END), 0) AS total_time_ms,
            COALESCE(COUNT(CASE WHEN s.is_correct THEN 1 END), 0) AS correct_count
        FROM public.participants p
        LEFT JOIN public.submissions s ON p.id = s.participant_id
        WHERE p.competition_id = p_competition_id
        GROUP BY p.id, p.student_name, p.school_name, p.student_class
    )
    SELECT 
        DENSE_RANK() OVER (
            ORDER BY 
                total_score DESC,
                round_2_score DESC,
                total_time_ms ASC
        ) AS rank,
        participant_id,
        student_name,
        school_name,
        student_class,
        round_1_score,
        100::BIGINT AS round_1_max_marks,
        ROUND((round_1_score::NUMERIC / 100.0) * 100.0, 1) AS round_1_pct,
        round_2_score,
        100::BIGINT AS round_2_max_marks,
        ROUND((round_2_score::NUMERIC / 100.0) * 100.0, 1) AS round_2_pct,
        total_score,
        200::BIGINT AS total_max_marks,
        ROUND((total_score::NUMERIC / 200.0) * 100.0, 1) AS total_pct,
        total_time_ms,
        correct_count,
        (round_1_score >= 60) AS is_qualified,
        (round_1_score >= 60) AS qualified_for_round_2
    FROM participant_scores
    ORDER BY rank ASC, student_name ASC;
$$;

-- ----------------------------------------------------------------------------
-- 11. ADMIN RBAC VERIFICATION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_admin_role_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_role RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('is_admin', false, 'error', 'Unauthenticated session.');
    END IF;

    SELECT * INTO v_role FROM public.admin_roles WHERE user_id = auth.uid();
    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_admin', true, 
            'role', v_role.role, 
            'email', COALESCE(v_role.email, (SELECT email FROM auth.users WHERE id = auth.uid()))
        );
    ELSE
        RETURN jsonb_build_object('is_admin', false, 'error', 'User does not possess administrative privileges.');
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. PERMISSIONS GRANT
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_or_restore_attempt(UUID, INT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_attempt_answer(UUID, INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt_rpc(UUID, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_answer(UUID, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_fullscreen_event(UUID, INT, TEXT, BIGINT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_role_rpc() TO authenticated, service_role;
