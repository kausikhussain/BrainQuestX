-- ============================================================================
-- QUIZMANIA: COMPETITIVE TECHNICAL QUIZ PLATFORM DATABASE SCHEMA
-- Target: PostgreSQL 14+ / Supabase
-- Designed for 50-60+ concurrent students, sub-second latency, zero question leakage
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. COMPETITIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE DEFAULT 'QUIZ-2026',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'results_published')),
    current_round_number INT DEFAULT 0,
    current_question_id TEXT,
    current_question_number INT DEFAULT 0,
    question_start_time TIMESTAMPTZ,
    question_deadline TIMESTAMPTZ,
    duration_per_question INT NOT NULL DEFAULT 20,
    auto_advance BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- ----------------------------------------------------------------------------
-- 2. ROUNDS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rounds (
    id TEXT PRIMARY KEY, -- e.g. 'round-1', 'round-2'
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    duration_per_question INT NOT NULL DEFAULT 20,
    total_questions INT NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (competition_id, round_number)
);

-- ----------------------------------------------------------------------------
-- 3. QUESTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY, -- e.g. 'r1-q1'
    round_id TEXT REFERENCES public.rounds(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    question_number INT NOT NULL,
    text TEXT NOT NULL,
    points INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (round_id, question_number)
);

-- ----------------------------------------------------------------------------
-- 4. QUESTION OPTIONS TABLE (Protected answer keys)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_options (
    id TEXT PRIMARY KEY, -- e.g. 'r1-q1-a'
    question_id TEXT REFERENCES public.questions(id) ON DELETE CASCADE,
    label VARCHAR(1) NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (question_id, label)
);

-- Index for instant option lookup
CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id);

-- ----------------------------------------------------------------------------
-- 5. PARTICIPANTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    school_name TEXT NOT NULL,
    student_class TEXT NOT NULL CHECK (student_class IN ('11th', '12th')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    -- Enforce single registration per student per school and class in a competition
    CONSTRAINT uq_participant_identity UNIQUE (competition_id, student_name, school_name, student_class)
);

CREATE INDEX IF NOT EXISTS idx_participants_comp ON public.participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(access_code);

-- ----------------------------------------------------------------------------
-- 6. SUBMISSIONS TABLE (Immutable, Idempotent, Server-Authoritative)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    question_id TEXT REFERENCES public.questions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
    selected_option_id TEXT REFERENCES public.question_options(id),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_awarded INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    -- Strict Idempotency: A student can submit at most once per question!
    CONSTRAINT uq_participant_question_submission UNIQUE (question_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_participant ON public.submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question ON public.submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_comp_round ON public.submissions(competition_id, round_number);

-- ----------------------------------------------------------------------------
-- 7. CLIENT-SAFE VIEW (Questions without correct answers)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_client_questions AS
SELECT 
    q.id AS question_id,
    q.round_id,
    q.round_number,
    q.question_number,
    q.text AS question_text,
    q.points,
    json_agg(
        json_build_object(
            'id', opt.id,
            'label', opt.label,
            'text', opt.text
        ) ORDER BY opt.label ASC
    ) AS options
FROM public.questions q
JOIN public.question_options opt ON q.id = opt.question_id
GROUP BY q.id, q.round_id, q.round_number, q.question_number, q.text, q.points;

-- ----------------------------------------------------------------------------
-- 8. AUTHORITATIVE STORED PROCEDURES (RPCs)
-- ----------------------------------------------------------------------------

-- RPC: Get server time (for client clock synchronization)
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
$$;

-- RPC: Register participant securely
CREATE OR REPLACE FUNCTION public.register_participant(
    p_competition_code TEXT,
    p_student_name TEXT,
    p_school_name TEXT,
    p_student_class TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comp RECORD;
    v_clean_name TEXT;
    v_clean_school TEXT;
    v_code TEXT;
    v_participant_id UUID;
    v_existing RECORD;
BEGIN
    -- Input sanitization
    v_clean_name := trim(p_student_name);
    v_clean_school := trim(p_school_name);
    
    IF v_clean_name = '' OR v_clean_school = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Name and school cannot be empty.');
    END IF;

    IF p_student_class NOT IN ('11th', '12th') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Class must be either 11th or 12th.');
    END IF;

    -- Verify competition registration is open
    SELECT * INTO v_comp FROM public.competitions WHERE code = p_competition_code;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found.');
    END IF;

    IF v_comp.status NOT IN ('registration_open', 'upcoming') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration for this competition is closed.');
    END IF;

    -- Check duplicate
    SELECT * INTO v_existing FROM public.participants 
    WHERE competition_id = v_comp.id 
      AND lower(student_name) = lower(v_clean_name) 
      AND lower(school_name) = lower(v_clean_school)
      AND student_class = p_student_class;

    IF FOUND THEN
        -- Graceful re-entry: return existing access credentials
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

    -- Generate random access code e.g. QZ-7821
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

-- RPC: Server-Authoritative Answer Submission
CREATE OR REPLACE FUNCTION public.submit_student_answer(
    p_participant_id UUID,
    p_question_id TEXT,
    p_selected_option_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- 1. Validate participant
    SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid participant ID.');
    END IF;

    -- 2. Validate competition state
    SELECT * INTO v_comp FROM public.competitions WHERE id = v_participant.competition_id;
    IF NOT FOUND OR v_comp.status != 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition is not currently active.');
    END IF;

    -- 3. Verify question is currently active
    IF v_comp.current_question_id != p_question_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'This question is not currently active.');
    END IF;

    -- 4. Strict Server-Authoritative Deadline Check (with 500ms network buffer)
    IF v_now > (v_comp.question_deadline + INTERVAL '500 milliseconds') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Deadline expired. Submission rejected.');
    END IF;

    -- 5. Calculate submission latency
    IF v_comp.question_start_time IS NOT NULL THEN
        v_latency := GREATEST(0, (EXTRACT(EPOCH FROM (v_now - v_comp.question_start_time)) * 1000)::INT);
    END IF;

    -- 6. Check duplicate submission (Idempotency)
    SELECT * INTO v_existing FROM public.submissions 
    WHERE question_id = p_question_id AND participant_id = p_participant_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true, 
            'already_submitted', true, 
            'message', 'Response already received and recorded.'
        );
    END IF;

    -- 7. Validate Option and Server-Side Scoring (Answer is never leaked back!)
    SELECT * INTO v_opt FROM public.question_options 
    WHERE id = p_selected_option_id AND question_id = p_question_id;

    IF FOUND THEN
        v_is_correct := v_opt.is_correct;
        IF v_is_correct THEN
            v_points := 10;
        END IF;
    END IF;

    -- 8. Insert record
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
        v_comp.id,
        v_comp.current_round_number,
        p_question_id,
        p_participant_id,
        p_selected_option_id,
        v_is_correct,
        v_points,
        v_latency,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_submitted', false,
        'received_at', v_now,
        'message', 'Answer securely recorded.'
    );
END;
$$;

-- RPC: Get deterministic Leaderboard with strict tie-breaking
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_competition_id UUID)
RETURNS TABLE (
    rank BIGINT,
    participant_id UUID,
    student_name TEXT,
    school_name TEXT,
    student_class TEXT,
    round_1_score BIGINT,
    round_2_score BIGINT,
    total_score BIGINT,
    total_time_ms BIGINT,
    correct_count BIGINT
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
        round_2_score,
        total_score,
        total_time_ms,
        correct_count
    FROM participant_scores
    ORDER BY rank ASC, student_name ASC;
$$;
