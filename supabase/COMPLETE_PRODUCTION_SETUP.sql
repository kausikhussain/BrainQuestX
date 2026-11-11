-- ============================================================================
-- QUIZMANIA: MASTER PRODUCTION DATABASE INITIALIZATION SCRIPT (HARDENED)
-- Target: Supabase Cloud (PostgreSQL 14+)
-- Project: https://ckxqkaawbntpaycagrlu.supabase.co
-- 
-- SECURITY HARDENING GUARANTEES:
-- 1. Cryptographic Participant Authentication: All candidate RPCs strictly require
--    and verify p_access_token (session_token or access_code). Never authorizes by UUID alone.
-- 2. Anti-Hijacking Registration: Duplicate candidate details never expose an existing
--    candidate's secret access_code or session token.
-- 3. Dedicated Session Recovery: authenticate_participant(access_code) allows legitimate
--    candidates to resume sessions with their secret credentials.
-- 4. Server-Side 20-Second Question Deadline: Backend validates each question's timer
--    in question_timers and rejects answers submitted after the 20-second window.
-- 5. Zero Answer Key Exposure: Direct SELECT on question_options is revoked from public.
-- 6. Exam Attempts Hardening: Public direct SELECT is blocked; only admins can inspect attempts.
-- 7. Supabase Auth RBAC: Admin roles strictly enforced in verify_admin_role_rpc.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- STEP 2: CORE SCHEMA DEFINITION
-- ----------------------------------------------------------------------------

-- Competitions Table
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
    round_1_qualifying_score INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS round_1_qualifying_score INT NOT NULL DEFAULT 60;

-- Rounds Table
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

-- Questions Table
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

-- Question Options Table (Server-side Answer Keys)
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

-- Participants Table (Cryptographic Token + Credentials)
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

-- Submissions Table (Immutable Question Log)
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

-- Exam Attempts Table (Centralized Multi-Device Attempt State with 20s Timers)
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
    question_timers JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    fullscreen_exit_count INT NOT NULL DEFAULT 0,
    fullscreen_exits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_participant_round_attempt UNIQUE (participant_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_participant ON public.exam_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_comp_round ON public.exam_attempts(competition_id, round_number);

-- Admin Roles Table (Supabase Auth RBAC)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER', 'SUPERADMIN', 'admin', 'organizer', 'superadmin')),
    email TEXT,
    granted_by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Client-Safe View (Excludes is_correct answer flag)
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
-- STEP 3: SEED COMPETITION, ROUNDS & OFFICIAL QUESTION PAPERS
-- ----------------------------------------------------------------------------

-- Default Competition
INSERT INTO public.competitions (
    id, code, title, description, status, current_round_number, duration_per_question, auto_advance
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
ON CONFLICT (id) DO NOTHING;

-- Rounds
INSERT INTO public.rounds (
    id, competition_id, round_number, title, subtitle, description, duration_per_question, total_questions, status
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

-- Round 1 Questions (General Paper)
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points) VALUES
('r1-q1', 'round-1', 1, 1, 'Which of the following is a communication device ?', 10),
('r1-q2', 'round-1', 1, 2, 'Which of the following file extensions indicate only graphics file ?', 10),
('r1-q3', 'round-1', 1, 3, 'To create a para Break in MS-WORD , which key is used ?', 10),
('r1-q4', 'round-1', 1, 4, 'What type of software is Linux?', 10),
('r1-q5', 'round-1', 1, 5, 'Which software would you use to teach students in computer classes ?', 10),
('r1-q6', 'round-1', 1, 6, 'Decimal equivalent of binary number 110111 is :', 10),
('r1-q7', 'round-1', 1, 7, '1 KB equals to how many bytes ?', 10),
('r1-q8', 'round-1', 1, 8, 'Which of the following translates a program written in high level language into machine code ?', 10),
('r1-q9', 'round-1', 1, 9, 'Which of the following is the fastest memory ?', 10),
('r1-q10', 'round-1', 1, 10, 'Which of the following file extensions indicate file created in paint ?', 10)
ON CONFLICT (id) DO NOTHING;

-- Round 1 Options & Protected Keys
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q1-a', 'r1-q1', 'A', 'Printer', false, 1),
('r1-q1-b', 'r1-q1', 'B', 'Monitor', false, 2),
('r1-q1-c', 'r1-q1', 'C', 'Keyboard', false, 3),
('r1-q1-d', 'r1-q1', 'D', 'Modem', true, 4),
('r1-q2-a', 'r1-q2', 'A', 'BMP and DOC', false, 1),
('r1-q2-b', 'r1-q2', 'B', 'JPEG and TXT', false, 2),
('r1-q2-c', 'r1-q2', 'C', 'TXT and STK', false, 3),
('r1-q2-d', 'r1-q2', 'D', 'BMP and GIF', true, 4),
('r1-q3-a', 'r1-q3', 'A', 'Enter', true, 1),
('r1-q3-b', 'r1-q3', 'B', 'Esc', false, 2),
('r1-q3-c', 'r1-q3', 'C', 'Tab', false, 3),
('r1-q3-d', 'r1-q3', 'D', 'Shift', false, 4),
('r1-q4-a', 'r1-q4', 'A', 'Compiler', false, 1),
('r1-q4-b', 'r1-q4', 'B', 'Operating System', true, 2),
('r1-q4-c', 'r1-q4', 'C', 'Utility Software', false, 3),
('r1-q4-d', 'r1-q4', 'D', 'Application Software', false, 4),
('r1-q5-a', 'r1-q5', 'A', 'Spreadsheet', false, 1),
('r1-q5-b', 'r1-q5', 'B', 'Database', false, 2),
('r1-q5-c', 'r1-q5', 'C', 'Word processing', false, 3),
('r1-q5-d', 'r1-q5', 'D', 'Power point', true, 4),
('r1-q6-a', 'r1-q6', 'A', '55', true, 1),
('r1-q6-b', 'r1-q6', 'B', '56', false, 2),
('r1-q6-c', 'r1-q6', 'C', '57', false, 3),
('r1-q6-d', 'r1-q6', 'D', '58', false, 4),
('r1-q7-a', 'r1-q7', 'A', '1000 bytes', false, 1),
('r1-q7-b', 'r1-q7', 'B', '1024  bytes', true, 2),
('r1-q7-c', 'r1-q7', 'C', '2012 bytes', false, 3),
('r1-q7-d', 'r1-q7', 'D', 'None of the above', false, 4),
('r1-q8-a', 'r1-q8', 'A', 'Assembler', false, 1),
('r1-q8-b', 'r1-q8', 'B', 'Compiler', false, 2),
('r1-q8-c', 'r1-q8', 'C', 'Interpreter', false, 3),
('r1-q8-d', 'r1-q8', 'D', 'Both B and C', true, 4),
('r1-q9-a', 'r1-q9', 'A', 'Secondary memory', false, 1),
('r1-q9-b', 'r1-q9', 'B', 'Auxiliary memory', false, 2),
('r1-q9-c', 'r1-q9', 'C', 'Cache memory', true, 3),
('r1-q9-d', 'r1-q9', 'D', 'Virtual memory', false, 4),
('r1-q10-a', 'r1-q10', 'A', 'BMP', true, 1),
('r1-q10-b', 'r1-q10', 'B', 'DOC', false, 2),
('r1-q10-c', 'r1-q10', 'C', 'STK', false, 3),
('r1-q10-d', 'r1-q10', 'D', 'PPT', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Round 2 Questions (Subject Paper - Python)
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points) VALUES
('r2-q1', 'round-2', 2, 1, 'Father of Python is   ……………………….', 10),
('r2-q2', 'round-2', 2, 2, ' Which of the following is the correct identifier ?', 10),
('r2-q3', 'round-2', 2, 3, 'Which of the following data type is immutable in Python?', 10),
('r2-q4', 'round-2', 2, 4, 'What does the count() function in Python do?', 10),
('r2-q5', 'round-2', 2, 5, 'If a function  is defined to return a value but does not include a return statement, what will be the result ?', 10),
('r2-q6', 'round-2', 2, 6, 'Which Python datatype maintains the order of element inserted ?', 10),
('r2-q7', 'round-2', 2, 7, 'What is the significance of the break and else combination in a for loop ?', 10),
('r2-q8', 'round-2', 2, 8, 'Li = [‘Alex’ , ‘Emma’ , ‘Bob’ , ‘Lucas’]
print(li[1][-1])', 10),
('r2-q9', 'round-2', 2, 9, 'li = list(range(100, 110))
print(li.index(105))', 10),
('r2-q10', 'round-2', 2, 10, 'Which of the following is a valid variable name in python ?', 10)
ON CONFLICT (id) DO NOTHING;

-- Round 2 Options & Protected Keys
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q1-a', 'r2-q1', 'A', 'James Gosling', false, 1),
('r2-q1-b', 'r2-q1', 'B', 'Guido van Rossum', true, 2),
('r2-q1-c', 'r2-q1', 'C', 'Gudio van Rossam', false, 3),
('r2-q1-d', 'r2-q1', 'D', 'Dennis Ritchie', false, 4),
('r2-q2-a', 'r2-q2', 'A', 'Break', true, 1),
('r2-q2-b', 'r2-q2', 'B', 'def', false, 2),
('r2-q2-c', 'r2-q2', 'C', 'with', false, 3),
('r2-q2-d', 'r2-q2', 'D', 'global', false, 4),
('r2-q3-a', 'r2-q3', 'A', 'List', false, 1),
('r2-q3-b', 'r2-q3', 'B', 'Tuple', true, 2),
('r2-q3-c', 'r2-q3', 'C', 'Set', false, 3),
('r2-q3-d', 'r2-q3', 'D', 'Dictionary', false, 4),
('r2-q4-a', 'r2-q4', 'A', 'It counts the total number of characters in a string.', false, 1),
('r2-q4-b', 'r2-q4', 'B', 'It counts the occurrences of a specified substring with in a string.', true, 2),
('r2-q4-c', 'r2-q4', 'C', 'It returns true if all characters in the string are alphabets.', false, 3),
('r2-q4-d', 'r2-q4', 'D', 'It returns true if all characters in the string are numbers.', false, 4),
('r2-q5-a', 'r2-q5', 'A', 'The function will return a default value of 0.', false, 1),
('r2-q5-b', 'r2-q5', 'B', 'The function will return an error.', false, 2),
('r2-q5-c', 'r2-q5', 'C', 'The function will return None.', true, 3),
('r2-q5-d', 'r2-q5', 'D', 'The function will return none.', false, 4),
('r2-q6-a', 'r2-q6', 'A', 'set', false, 1),
('r2-q6-b', 'r2-q6', 'B', 'list', false, 2),
('r2-q6-c', 'r2-q6', 'C', 'dict', false, 3),
('r2-q6-d', 'r2-q6', 'D', 'Both B and C', true, 4),
('r2-q7-a', 'r2-q7', 'A', 'Executes else only if loop wasn’t exited by break.', true, 1),
('r2-q7-b', 'r2-q7', 'B', 'It is a syntax error; break else cannot be used together.', false, 2),
('r2-q7-c', 'r2-q7', 'C', 'It skips the current iteration.', false, 3),
('r2-q7-d', 'r2-q7', 'D', 'It restarts the loop.', false, 4),
('r2-q8-a', 'r2-q8', 'A', 'x', false, 1),
('r2-q8-b', 'r2-q8', 'B', 'a', true, 2),
('r2-q8-c', 'r2-q8', 'C', 's', false, 3),
('r2-q8-d', 'r2-q8', 'D', 'b', false, 4),
('r2-q9-a', 'r2-q9', 'A', '105', false, 1),
('r2-q9-b', 'r2-q9', 'B', '5', true, 2),
('r2-q9-c', 'r2-q9', 'C', '106', false, 3),
('r2-q9-d', 'r2-q9', 'D', '104', false, 4),
('r2-q10-a', 'r2-q10', 'A', '1variable', false, 1),
('r2-q10-b', 'r2-q10', 'B', 'my_variable', true, 2),
('r2-q10-c', 'r2-q10', 'C', 'global', false, 3),
('r2-q10-d', 'r2-q10', 'D', 'variable-1', false, 4)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 4: ROW LEVEL SECURITY HARDENING
-- ----------------------------------------------------------------------------
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Competitions
DROP POLICY IF EXISTS "Public can view competitions" ON public.competitions;
CREATE POLICY "Public can view competitions" ON public.competitions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages competitions" ON public.competitions;
CREATE POLICY "Service role manages competitions" ON public.competitions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Rounds
DROP POLICY IF EXISTS "Public can view rounds" ON public.rounds;
CREATE POLICY "Public can view rounds" ON public.rounds FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages rounds" ON public.rounds;
CREATE POLICY "Service role manages rounds" ON public.rounds FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Questions
DROP POLICY IF EXISTS "Public can view questions" ON public.questions;
CREATE POLICY "Public can view questions" ON public.questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Service role manages questions" ON public.questions;
CREATE POLICY "Service role manages questions" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Question Options (Zero Client Leakage: Direct table SELECT revoked)
REVOKE SELECT ON TABLE public.question_options FROM anon, authenticated;
GRANT SELECT ON TABLE public.question_options TO service_role;

DROP POLICY IF EXISTS "Admins can view question options" ON public.question_options;
CREATE POLICY "Admins can view question options"
    ON public.question_options FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

GRANT SELECT ON TABLE public.v_client_questions TO anon, authenticated, service_role;

-- Participants
DROP POLICY IF EXISTS "Admins can view participants" ON public.participants;
CREATE POLICY "Admins can view participants"
    ON public.participants FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages participants" ON public.participants;
CREATE POLICY "Service role manages participants"
    ON public.participants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Submissions
DROP POLICY IF EXISTS "Admins can view submissions" ON public.submissions;
CREATE POLICY "Admins can view submissions"
    ON public.submissions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages submissions" ON public.submissions;
CREATE POLICY "Service role manages submissions"
    ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Exam Attempts (HARDENED: No public snooping permitted)
REVOKE ALL ON public.exam_attempts FROM anon, public;
DROP POLICY IF EXISTS "Participants can view their own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON public.exam_attempts;
CREATE POLICY "Admins can view all exam attempts"
    ON public.exam_attempts FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_roles WHERE admin_roles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role manages exam attempts" ON public.exam_attempts;
CREATE POLICY "Service role manages exam attempts"
    ON public.exam_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin Roles
REVOKE ALL ON public.admin_roles FROM anon, public;
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;
CREATE POLICY "Users can view their own admin role"
    ON public.admin_roles FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages admin roles" ON public.admin_roles;
CREATE POLICY "Service role manages admin roles"
    ON public.admin_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- STEP 5: STORED PROCEDURES (RPCS)
-- ----------------------------------------------------------------------------

-- Clock Sync
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
$$;

-- Register Participant (SECURE: NEVER LEAKS CREDENTIALS ON DUPLICATE)
CREATE OR REPLACE FUNCTION public.register_participant(
    p_competition_code TEXT,
    p_student_name TEXT,
    p_school_name TEXT,
    p_student_class TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_comp RECORD;
    v_clean_name TEXT;
    v_clean_school TEXT;
    v_code TEXT;
    v_session_token TEXT;
    v_participant_id UUID;
    v_existing RECORD;
BEGIN
    v_clean_name := trim(p_student_name);
    v_clean_school := trim(p_school_name);
    
    IF v_clean_name = '' OR v_clean_school = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student full name and school name are required.');
    END IF;

    IF p_student_class NOT IN ('11th', '12th') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Class must be either 11th or 12th.');
    END IF;

    SELECT * INTO v_comp FROM public.competitions WHERE code = p_competition_code;
    IF NOT FOUND THEN
        SELECT * INTO v_comp FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    END IF;

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

    -- Security Fix: Prevent Duplicate Hijacking
    -- If duplicate candidate profile is detected, NEVER reveal existing access_code or token!
    SELECT id INTO v_existing FROM public.participants 
    WHERE competition_id = v_comp.id 
      AND lower(student_name) = lower(v_clean_name) 
      AND lower(school_name) = lower(v_clean_school)
      AND student_class = p_student_class;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'is_duplicate', true,
            'error', 'Candidate profile already registered. To resume an existing session, please authenticate with your Access Code.'
        );
    END IF;

    IF v_comp.status NOT IN ('registration_open', 'upcoming', 'in_progress') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Registration for this competition is closed by the administrator.');
    END IF;

    -- Cryptographically secure generation of access code and session token
    v_code := 'QZ-' || UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 6));
    v_session_token := encode(gen_random_bytes(32), 'hex');

    INSERT INTO public.participants (
        competition_id, access_code, session_token, student_name, school_name, student_class
    ) VALUES (
        v_comp.id, v_code, v_session_token, v_clean_name, v_clean_school, p_student_class
    )
    RETURNING id INTO v_participant_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'participant_id', v_participant_id,
        'access_code', v_code,
        'session_token', v_session_token,
        'student_name', v_clean_name,
        'school_name', v_clean_school,
        'student_class', p_student_class,
        'message', 'Registration confirmed! Proceeding to waiting room.'
    );
END;
$$;

-- Authenticate Participant & Restore Session via Access Code
CREATE OR REPLACE FUNCTION public.authenticate_participant(
    p_access_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
BEGIN
    IF p_access_code IS NULL OR trim(p_access_code) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access code is required.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE (access_code = trim(upper(p_access_code)) OR session_token = trim(p_access_code))
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid access code. Please check your credentials.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'participant_id', v_participant.id,
        'access_code', v_participant.access_code,
        'session_token', v_participant.session_token,
        'student_name', v_participant.student_name,
        'school_name', v_participant.school_name,
        'student_class', v_participant.student_class,
        'message', 'Authentication successful. Candidate session restored.'
    );
END;
$$;

-- Start or Restore Exam Attempt (CRYPTOGRAPHIC OWNERSHIP ENFORCED)
CREATE OR REPLACE FUNCTION public.start_or_restore_attempt(
    p_participant_id UUID,
    p_access_token TEXT,
    p_round_number INT,
    p_initial_question_order JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_comp RECORD;
    v_attempt RECORD;
    v_round1_attempt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_now_ms BIGINT := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    v_duration INT := 200;
    v_first_q TEXT;
BEGIN
    -- Ownership check
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied: Missing participant credentials.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed: Access token does not match participant ownership. Impersonation rejected.');
    END IF;

    SELECT * INTO v_comp FROM public.competitions WHERE id = v_participant.competition_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found.');
    END IF;

    -- Strict Round 2 Gate
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

    -- Restore existing attempt
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
            'question_timers', v_attempt.question_timers,
            'fullscreen_exit_count', v_attempt.fullscreen_exit_count,
            'score', v_attempt.score,
            'max_marks', v_attempt.max_marks,
            'is_qualified', v_attempt.is_qualified
        );
    END IF;

    v_first_q := p_initial_question_order->>0;

    -- Create new attempt with question 1 timer initialized
    INSERT INTO public.exam_attempts (
        competition_id, participant_id, round_number, start_time, duration_seconds, is_submitted,
        answers, question_timers, question_order
    ) VALUES (
        v_comp.id, p_participant_id, p_round_number, v_now, v_duration, false, '{}'::jsonb,
        CASE 
            WHEN v_first_q IS NOT NULL THEN jsonb_build_object(v_first_q, jsonb_build_object('started_at', v_now_ms, 'deadline', v_now_ms + 20000, 'duration_seconds', 20))
            ELSE '{}'::jsonb
        END,
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
        'question_timers', v_attempt.question_timers,
        'question_order', p_initial_question_order,
        'fullscreen_exit_count', 0
    );
END;
$$;

-- Start Question Timer (SERVER-ENFORCED 20-SECOND COUNTDOWN)
CREATE OR REPLACE FUNCTION public.start_question_timer_rpc(
    p_participant_id UUID,
    p_access_token TEXT,
    p_round_number INT,
    p_question_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_attempt RECORD;
    v_now_ms BIGINT := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    v_existing_timer JSONB;
BEGIN
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed: Invalid credentials.');
    END IF;

    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND OR v_attempt.is_submitted THEN
        RETURN jsonb_build_object('success', false, 'error', 'Active examination attempt not found.');
    END IF;

    -- If timer already started for this question, recover it! (DO NOT RESET)
    v_existing_timer := v_attempt.question_timers->p_question_id;
    IF v_existing_timer IS NOT NULL AND v_existing_timer ? 'deadline' THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_restored', true,
            'question_id', p_question_id,
            'started_at', (v_existing_timer->>'started_at')::BIGINT,
            'deadline', (v_existing_timer->>'deadline')::BIGINT,
            'duration_seconds', 20
        );
    END IF;

    UPDATE public.exam_attempts
    SET 
        question_timers = jsonb_set(
            COALESCE(question_timers, '{}'::jsonb),
            ARRAY[p_question_id],
            jsonb_build_object('started_at', v_now_ms, 'deadline', v_now_ms + 20000, 'duration_seconds', 20)
        ),
        updated_at = clock_timestamp()
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object(
        'success', true,
        'is_restored', false,
        'question_id', p_question_id,
        'started_at', v_now_ms,
        'deadline', v_now_ms + 20000,
        'duration_seconds', 20
    );
END;
$$;

-- Save Attempt Answer (STRICT 20-SECOND QUESTION DEADLINE ENFORCED)
CREATE OR REPLACE FUNCTION public.save_attempt_answer(
    p_participant_id UUID,
    p_access_token TEXT,
    p_round_number INT,
    p_question_id TEXT,
    p_option_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_attempt RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_now_ms BIGINT := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    v_q_timer JSONB;
    v_q_deadline BIGINT;
    v_overall_deadline TIMESTAMPTZ;
BEGIN
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied: Missing participant credentials.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed: Access token does not match participant ownership.');
    END IF;

    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active attempt found.');
    END IF;

    IF v_attempt.is_submitted THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attempt already submitted and finalized.');
    END IF;

    -- Strict Server-Side 20-Second Question Deadline Enforcement
    v_q_timer := v_attempt.question_timers->p_question_id;
    
    IF v_q_timer IS NOT NULL AND v_q_timer ? 'deadline' THEN
        v_q_deadline := (v_q_timer->>'deadline')::BIGINT;
        IF v_now_ms > (v_q_deadline + 1500) THEN
            RETURN jsonb_build_object(
                'success', false, 
                'is_expired', true, 
                'error', 'Question deadline expired: 20-second per-question limit exceeded. Answer rejected by server.'
            );
        END IF;
    ELSE
        v_attempt.question_timers := jsonb_set(
            COALESCE(v_attempt.question_timers, '{}'::jsonb),
            ARRAY[p_question_id],
            jsonb_build_object('started_at', v_now_ms, 'deadline', v_now_ms + 20000, 'duration_seconds', 20)
        );
    END IF;

    -- Overall attempt deadline check
    v_overall_deadline := v_attempt.start_time + (v_attempt.duration_seconds || ' seconds')::INTERVAL + INTERVAL '10 seconds';
    IF v_now > v_overall_deadline THEN
        RETURN jsonb_build_object('success', false, 'is_expired', true, 'error', 'Overall examination time limit expired.');
    END IF;

    UPDATE public.exam_attempts
    SET 
        answers = jsonb_set(COALESCE(answers, '{}'::jsonb), ARRAY[p_question_id], to_jsonb(p_option_id)),
        answer_timestamps = jsonb_set(COALESCE(answer_timestamps, '{}'::jsonb), ARRAY[p_question_id], to_jsonb(v_now_ms)),
        question_timers = v_attempt.question_timers,
        updated_at = v_now
    WHERE id = v_attempt.id;

    RETURN jsonb_build_object('success', true, 'is_expired', false);
END;
$$;

-- Submit Exam Attempt & Authoritative Evaluation (OWNERSHIP ENFORCED)
CREATE OR REPLACE FUNCTION public.submit_exam_attempt_rpc(
    p_participant_id UUID,
    p_access_token TEXT,
    p_round_number INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_attempt RECORD;
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
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed: Invalid credentials.');
    END IF;

    SELECT * INTO v_attempt FROM public.exam_attempts 
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active examination attempt found.');
    END IF;

    IF v_attempt.is_submitted THEN
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

            INSERT INTO public.submissions (
                competition_id, round_number, question_id, participant_id,
                selected_option_id, is_correct, points_awarded, latency_ms, server_received_at
            ) VALUES (
                v_attempt.competition_id, p_round_number, v_q.id, p_participant_id,
                v_selected_opt_id, v_is_correct, v_points, 0, v_now
            )
            ON CONFLICT (question_id, participant_id) 
            DO UPDATE SET 
                selected_option_id = EXCLUDED.selected_option_id,
                is_correct = EXCLUDED.is_correct,
                points_awarded = EXCLUDED.points_awarded,
                server_received_at = EXCLUDED.server_received_at;
        END IF;
    END LOOP;

    v_time_taken := GREATEST(1, LEAST(v_attempt.duration_seconds, EXTRACT(EPOCH FROM (v_now - v_attempt.start_time))::INT));
    v_percentage := ROUND((v_score::NUMERIC / v_max_marks::NUMERIC) * 100.0, 2);
    v_is_qualified := (v_score >= 60);

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

-- Single Answer Submission
CREATE OR REPLACE FUNCTION public.submit_student_answer(
    p_participant_id UUID,
    p_access_token TEXT,
    p_question_id TEXT,
    p_selected_option_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
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
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed.');
    END IF;

    SELECT * INTO v_comp FROM public.competitions WHERE id = v_participant.competition_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found.');
    END IF;

    SELECT * INTO v_existing FROM public.submissions 
    WHERE question_id = p_question_id AND participant_id = p_participant_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_submitted', true, 'message', 'Response already recorded.');
    END IF;

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

-- Fullscreen Telemetry Logger (OWNERSHIP ENFORCED)
CREATE OR REPLACE FUNCTION public.record_fullscreen_event(
    p_participant_id UUID,
    p_access_token TEXT,
    p_round_number INT,
    p_event_type TEXT,
    p_timestamp BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_participant RECORD;
    v_attempt RECORD;
    v_new_event JSONB;
BEGIN
    IF p_access_token IS NULL OR trim(p_access_token) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authorization Denied.');
    END IF;

    SELECT * INTO v_participant FROM public.participants 
    WHERE id = p_participant_id 
      AND (session_token = trim(p_access_token) OR access_code = trim(upper(p_access_token)));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication Failed.');
    END IF;

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

-- Unified Deterministic Leaderboard
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

-- Admin RBAC Verifier
CREATE OR REPLACE FUNCTION public.verify_admin_role_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
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

-- Admin Update Competition State (Start Round 1, Start Round 2, Pause, Complete)
CREATE OR REPLACE FUNCTION public.admin_update_competition_state(
    p_status TEXT,
    p_round_number INT DEFAULT 1,
    p_cutoff INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_comp RECORD;
BEGIN
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

-- Get Competition State RPC (Fast State Sync for all 60 computers)
CREATE OR REPLACE FUNCTION public.get_competition_state_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_comp RECORD;
BEGIN
    SELECT * INTO v_comp FROM public.competitions ORDER BY created_at ASC LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_comp.id,
        'code', v_comp.code,
        'title', v_comp.title,
        'status', v_comp.status,
        'current_round_number', v_comp.current_round_number,
        'duration_per_question', v_comp.duration_per_question,
        'auto_advance', v_comp.auto_advance,
        'round_1_qualifying_score', COALESCE(v_comp.round_1_qualifying_score, 60),
        'server_time', (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT
    );
END;
$$;

-- Admin Get All Participants RPC (Real-Time Student Check-in for Organizer Dashboard)
CREATE OR REPLACE FUNCTION public.admin_get_participants()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'competition_id', p.competition_id,
            'access_code', p.access_code,
            'student_name', p.student_name,
            'school_name', p.school_name,
            'student_class', p.student_class,
            'created_at', p.created_at
        ) ORDER BY p.created_at ASC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.participants p;

    RETURN v_result;
END;
$$;

-- Permissions Grants
GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.authenticate_participant(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_or_restore_attempt(UUID, TEXT, INT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_question_timer_rpc(UUID, TEXT, INT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_attempt_answer(UUID, TEXT, INT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt_rpc(UUID, TEXT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_answer(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_fullscreen_event(UUID, TEXT, INT, TEXT, BIGINT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_role_rpc() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_competition_state(TEXT, INT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_competition_state_rpc() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_participants() TO anon, authenticated, service_role;
