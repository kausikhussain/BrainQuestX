-- ============================================================================
-- QUIZMANIA PRODUCTION MIGRATION: ORGANIZER CREDENTIALS & SERVER AUTHENTICATION
-- Target: Supabase Cloud PostgreSQL 15+
--
-- Implements:
-- 1. public.admin_users table for username/password authentication (bcrypt hashed).
-- 2. Seeds 'admin' / 'admin123' securely on the server (zero client exposure).
-- 3. public.admin_login_rpc(p_username, p_password) -> generates 256-bit session token.
-- 4. public.verify_admin_session_rpc(p_token) -> verifies active session.
-- 5. public.admin_logout_rpc(p_token) -> server-side token invalidation.
-- 6. Server-side token authorization on admin_update_competition_state and admin_get_participants.
-- ============================================================================

-- Step 1: Ensure extensions schema is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create admin_users table
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

-- Step 3: Hardened Row Level Security & Table Privileges
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_users FROM anon, public;
GRANT ALL ON TABLE public.admin_users TO service_role;

-- Step 4: Seed 'admin' organizer credentials with bcrypt hashing
-- Password 'admin123' is hashed inside PostgreSQL via pgcrypto's crypt + gen_salt
INSERT INTO public.admin_users (username, password_hash, role)
VALUES (
    'admin', 
    extensions.crypt('admin123', extensions.gen_salt('bf', 10)), 
    'SUPERADMIN'
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
    role = 'SUPERADMIN';

-- Step 5: Server-Side Administrator Login RPC
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

-- Step 6: Server-Side Administrator Session Verification RPC
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

-- Step 7: Server-Side Administrator Logout RPC
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

-- Step 8: Update admin_update_competition_state with server token authorization
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

-- Step 9: Update admin_get_participants with server token authorization
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
            'created_at', p.created_at
        ) ORDER BY p.created_at ASC
    ), '[]'::jsonb)
    INTO v_result
    FROM public.participants p;

    RETURN v_result;
END;
$$;

-- Step 10: Permissions Grants
GRANT EXECUTE ON FUNCTION public.admin_login_rpc(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_session_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_logout_rpc(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_competition_state(TEXT, INT, INT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_participants(TEXT) TO anon, authenticated, service_role;
