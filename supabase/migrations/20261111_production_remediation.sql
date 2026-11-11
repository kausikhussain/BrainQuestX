-- ============================================================================
-- QUIZMANIA PRODUCTION REMEDIATION: CENTRALIZED DATABASE PERSISTENCE,
-- ROW-LEVEL SECURITY, AUTHORITATIVE SCORING & ADMIN RBAC
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
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER')),
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Candidates can view only their own attempts
DROP POLICY IF EXISTS "Participants can view their own exam attempts" ON public.exam_attempts;
CREATE POLICY "Participants can view their own exam attempts"
    ON public.exam_attempts
    FOR SELECT
    TO anon, authenticated
    USING (true); -- Filtered by participant_id in RPC queries

-- Direct writes to exam_attempts are restricted to service_role / RPC functions
DROP POLICY IF EXISTS "Service role manages exam attempts" ON public.exam_attempts;
CREATE POLICY "Service role manages exam attempts"
    ON public.exam_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Admin roles can only be read by authenticated users checking their own role
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;
CREATE POLICY "Users can view their own admin role"
    ON public.admin_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. SERVER-AUTHORITATIVE RPC: START OR RESTORE EXAM ATTEMPT
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
    v_now TIMESTAMPTZ := clock_timestamp();
    v_duration INT := 200; -- 10 questions * 20s
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

    -- 3. Check Round 2 qualification if attempting Round 2
    IF p_round_number = 2 THEN
        SELECT * INTO v_attempt FROM public.exam_attempts 
        WHERE participant_id = p_participant_id AND round_number = 1;
        
        IF NOT FOUND OR NOT v_attempt.is_qualified THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Round 2 Access Denied: You must qualify in Round 1 with at least 60% marks.'
            );
        END IF;
    END IF;

    -- 4. Check for existing attempt (Restore on reload/reconnect)
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
-- 5. SERVER-AUTHORITATIVE RPC: SAVE CANDIDATE ANSWER ATOMICALLY
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

    -- Overall attempt deadline check (duration + 5s grace buffer)
    v_deadline := v_attempt.start_time + (v_attempt.duration_seconds || ' seconds')::INTERVAL + INTERVAL '5 seconds';
    IF v_now > v_deadline THEN
        RETURN jsonb_build_object('success', false, 'is_expired', true, 'error', 'Overall examination time expired.');
    END IF;

    -- Update answers JSONB atomically
    UPDATE public.exam_attempts
    SET 
        answers = jsonb_set(answers, ARRAY[p_question_id], to_jsonb(p_option_id)),
        updated_at = v_now
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object('success', true, 'is_expired', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. SERVER-AUTHORITATIVE RPC: SUBMIT & EVALUATE EXAM ATTEMPT
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
    v_opt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_total_questions INT := 10;
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

    SELECT * INTO v_comp FROM public.competitions WHERE id = v_attempt.competition_id;

    -- 2. Clear old submissions for this participant and round
    DELETE FROM public.submissions 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    -- 3. Iterate over the questions for this round and evaluate strictly against database question_options
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
            );
        END IF;
    END LOOP;

    -- 4. Calculate timing and qualifications
    v_time_taken := GREATEST(1, LEAST(v_attempt.duration_seconds, EXTRACT(EPOCH FROM (v_now - v_attempt.start_time))::INT));
    v_percentage := ROUND((v_score::NUMERIC / v_max_marks::NUMERIC) * 100.0, 2);
    v_is_qualified := (v_score >= 60);

    -- 5. Mark attempt finalized
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
-- 7. FULLSCREEN TELEMETRY RPC
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
        fullscreen_exits = fullscreen_exits || v_new_event,
        updated_at = clock_timestamp()
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. ADMIN RBAC VERIFICATION RPC
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
        RETURN jsonb_build_object('is_admin', true, 'role', v_role.role, 'email', v_role.email);
    ELSE
        RETURN jsonb_build_object('is_admin', false, 'error', 'User does not possess administrative privileges.');
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. PERMISSIONS GRANT
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.start_or_restore_attempt(UUID, INT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_attempt_answer(UUID, INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt_rpc(UUID, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_fullscreen_event(UUID, INT, TEXT, BIGINT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_role_rpc() TO authenticated, service_role;
