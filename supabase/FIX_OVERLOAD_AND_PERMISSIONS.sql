-- ============================================================================
-- QUIZMANIA DATABASE HOTFIX: RESOLVE FUNCTION OVERLOAD & PERMISSIONS
-- Run this in Supabase Dashboard -> SQL Editor
-- URL: https://ckxqkaawbntpaycagrlu.supabase.co
-- ============================================================================

-- 1. Remove duplicate/conflicting function overloads
DROP FUNCTION IF EXISTS public.admin_get_participants();
DROP FUNCTION IF EXISTS public.admin_get_participants(text);

-- 2. Create authoritative single admin_get_participants with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.admin_get_participants()
RETURNS TABLE (
    id UUID,
    competition_id UUID,
    access_code TEXT,
    student_name TEXT,
    school_name TEXT,
    student_class TEXT,
    is_active BOOLEAN,
    last_ping_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT 
        id, 
        competition_id, 
        access_code, 
        student_name, 
        school_name, 
        student_class, 
        is_active, 
        last_ping_at, 
        created_at
    FROM public.participants
    ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_participants() TO anon, authenticated, service_role;

-- 3. Fix get_leaderboard with SECURITY DEFINER so anon client can retrieve standings
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
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
    WITH participant_scores AS (
        SELECT 
            p.id AS participant_id,
            p.student_name,
            p.school_name,
            p.student_class,
            COALESCE(r1.score, 0)::BIGINT AS round_1_score,
            COALESCE(r1.max_marks, 100)::BIGINT AS round_1_max_marks,
            COALESCE(r1.percentage, 0)::NUMERIC AS round_1_pct,
            COALESCE(r2.score, 0)::BIGINT AS round_2_score,
            COALESCE(r2.max_marks, 100)::BIGINT AS round_2_max_marks,
            COALESCE(r2.percentage, 0)::NUMERIC AS round_2_pct,
            (COALESCE(r1.score, 0) + COALESCE(r2.score, 0))::BIGINT AS total_score,
            (COALESCE(r1.max_marks, 100) + CASE WHEN r2.id IS NOT NULL THEN COALESCE(r2.max_marks, 100) ELSE 0 END)::BIGINT AS total_max_marks,
            ROUND(
                ((COALESCE(r1.score, 0) + COALESCE(r2.score, 0))::NUMERIC / 
                NULLIF(COALESCE(r1.max_marks, 100) + CASE WHEN r2.id IS NOT NULL THEN COALESCE(r2.max_marks, 100) ELSE 0 END, 0)::NUMERIC) * 100, 
                1
            ) AS total_pct,
            ((COALESCE(r1.time_taken_seconds, 0) + COALESCE(r2.time_taken_seconds, 0)) * 1000)::BIGINT AS total_time_ms,
            (COALESCE(r1.correct_count, 0) + COALESCE(r2.correct_count, 0))::BIGINT AS correct_count,
            COALESCE(r1.is_qualified, false) AS is_qualified,
            COALESCE(r1.is_qualified, false) AS qualified_for_round_2
        FROM public.participants p
        LEFT JOIN public.exam_attempts r1 ON r1.participant_id = p.id AND r1.round_number = 1
        LEFT JOIN public.exam_attempts r2 ON r2.participant_id = p.id AND r2.round_number = 2
        WHERE p.competition_id = p_competition_id
    )
    SELECT 
        DENSE_RANK() OVER (
            ORDER BY 
                total_score DESC, 
                round_2_score DESC, 
                round_1_score DESC, 
                total_time_ms ASC, 
                student_name ASC
        ) AS rank,
        participant_id,
        student_name,
        school_name,
        student_class,
        round_1_score,
        round_1_max_marks,
        round_1_pct,
        round_2_score,
        round_2_max_marks,
        round_2_pct,
        total_score,
        total_max_marks,
        total_pct,
        total_time_ms,
        correct_count,
        is_qualified,
        qualified_for_round_2
    FROM participant_scores
    ORDER BY rank ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID) TO anon, authenticated, service_role;

-- 4. Fullscreen Telemetry Event Recorder
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
        fullscreen_exit_count = CASE WHEN p_event_type = 'exit' OR p_event_type LIKE '%EXIT%' THEN fullscreen_exit_count + 1 ELSE fullscreen_exit_count END,
        fullscreen_exits = COALESCE(fullscreen_exits, '[]'::jsonb) || v_new_event,
        updated_at = clock_timestamp()
    WHERE participant_id = p_participant_id AND round_number = p_round_number;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_fullscreen_event(UUID, INT, TEXT, BIGINT) TO anon, authenticated, service_role;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
