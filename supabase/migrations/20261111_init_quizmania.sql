-- ============================================================================
-- QUIZMANIA: COMPETITIVE TECHNICAL QUIZ PLATFORM DATABASE SCHEMA (STEP 1)
-- Target: PostgreSQL 14+ / Supabase Cloud
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
    status TEXT NOT NULL DEFAULT 'registration_open' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'results_published')),
    current_round_number INT DEFAULT 1,
    current_question_id TEXT,
    current_question_number INT DEFAULT 0,
    question_start_time TIMESTAMPTZ,
    question_deadline TIMESTAMPTZ,
    duration_per_question INT NOT NULL DEFAULT 20,
    auto_advance BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Insert default competition if it doesn't already exist
INSERT INTO public.competitions (
    id,
    code,
    title,
    description,
    status,
    current_round_number,
    duration_per_question,
    auto_advance
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'QUIZ-2026',
    'Inter-School Technical Quiz Competition 2026',
    'Offline technical examination for Class 11th & 12th students featuring General Tech & Python Programming rounds.',
    'registration_open',
    1,
    20,
    true
)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. ROUNDS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rounds (
    id TEXT PRIMARY KEY,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    duration_per_question INT NOT NULL DEFAULT 20,
    total_questions INT NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (competition_id, round_number)
);

-- Insert initial rounds
INSERT INTO public.rounds (
    id,
    competition_id,
    round_number,
    title,
    subtitle,
    description,
    duration_per_question,
    total_questions,
    status
) VALUES 
(
    'round-1',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Round 1: General Paper',
    'Computer Fundamentals, Architecture & General Tech',
    '10 questions covering computer fundamentals, file formats, memory architecture and operating systems.',
    20,
    10,
    'active'
),
(
    'round-2',
    '00000000-0000-0000-0000-000000000001',
    2,
    'Round 2: Subject Paper',
    'Python Programming, Syntax & Data Structures',
    '10 questions evaluating core Python syntax, mutability, execution order, built-in functions, and indexing.',
    20,
    10,
    'pending'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. QUESTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
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
    id TEXT PRIMARY KEY,
    question_id TEXT REFERENCES public.questions(id) ON DELETE CASCADE,
    label VARCHAR(1) NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (question_id, label)
);

CREATE INDEX IF NOT EXISTS idx_options_question ON public.question_options(question_id);

-- ----------------------------------------------------------------------------
-- 5. PARTICIPANTS TABLE (Cryptographic Session Token & Identity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL UNIQUE,
    session_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    student_name TEXT NOT NULL,
    school_name TEXT NOT NULL,
    student_class TEXT NOT NULL CHECK (student_class IN ('11th', '12th')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_participant_identity UNIQUE (competition_id, student_name, school_name, student_class)
);

CREATE INDEX IF NOT EXISTS idx_participants_comp ON public.participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(access_code);
CREATE INDEX IF NOT EXISTS idx_participants_session ON public.participants(session_token);

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
-- 8. SERVER CLOCK RPC (Synchronizes client timers with database)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
$$;
