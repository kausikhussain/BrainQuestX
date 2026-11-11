-- ============================================================================
-- QUIZMANIA DATABASE SECURITY HARDENING: ROW LEVEL SECURITY (RLS) POLICIES
-- Target: PostgreSQL 14+ / Supabase Cloud
-- Purpose: Enforce strict least-privilege access, prevent answer leakage,
--          and ensure public users cannot tamper with submissions or admin state.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. COMPETITIONS & ROUNDS POLICIES
-- ----------------------------------------------------------------------------
-- Public can read active competition status (needed for real-time synchronization)
DROP POLICY IF EXISTS "Public can view competitions" ON public.competitions;
CREATE POLICY "Public can view competitions"
    ON public.competitions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Deny public writes (Only service_role or authenticated admin can mutate)
DROP POLICY IF EXISTS "Service role manages competitions" ON public.competitions;
CREATE POLICY "Service role manages competitions"
    ON public.competitions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Public can read rounds
DROP POLICY IF EXISTS "Public can view rounds" ON public.rounds;
CREATE POLICY "Public can view rounds"
    ON public.rounds
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 3. QUESTIONS & OPTIONS (CRITICAL: ZERO ANSWER KEY LEAKAGE)
-- ----------------------------------------------------------------------------
-- Public can read questions
DROP POLICY IF EXISTS "Public can view questions" ON public.questions;
CREATE POLICY "Public can view questions"
    ON public.questions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Revoke direct table SELECT on question_options from anon and authenticated
-- Candidates must query through the secure view v_client_questions!
REVOKE SELECT ON TABLE public.question_options FROM anon, authenticated;
GRANT SELECT ON TABLE public.question_options TO service_role;

-- Grant access to client-safe view which strips is_correct
GRANT SELECT ON TABLE public.v_client_questions TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. PARTICIPANTS & SUBMISSIONS (IMMUTABLE, SERVER-AUTHORITATIVE)
-- ----------------------------------------------------------------------------
-- Deny public direct INSERT on participants (must go through register_participant RPC)
DROP POLICY IF EXISTS "Service role manages participants" ON public.participants;
CREATE POLICY "Service role manages participants"
    ON public.participants
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Deny public direct INSERT/UPDATE on submissions (must go through submit_student_answer RPC)
DROP POLICY IF EXISTS "Service role manages submissions" ON public.submissions;
CREATE POLICY "Service role manages submissions"
    ON public.submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. RPC FUNCTION EXECUTION PERMISSIONS
-- ----------------------------------------------------------------------------
-- Grant public execution of candidate RPCs
GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_participant(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_answer(UUID, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID) TO anon, authenticated, service_role;
