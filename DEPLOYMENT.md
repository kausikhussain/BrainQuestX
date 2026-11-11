# Quizmania Production Deployment & Database Initialization Guide

This guide details the complete production database initialization procedure for **Quizmania** on **Supabase Cloud (PostgreSQL 15+)** connected to your frontend on **Vercel**.

---

## 1. Current Diagnostic & Root Cause

If your Supabase Dashboard displays:
- **Status:** Healthy
- **Last migration:** No migrations
- **API Gateway errors:** ~98 errors (40.6% success rate)
- **Symptom 1:** Student registration fails (`public.register_participant(...) not found`)
- **Symptom 2:** Admin login returns `Invalid login credentials`
- **Symptom 3:** Supabase Table Editor is empty (missing `competitions`, `participants`, `questions`)

**Root Cause:**  
Your Vercel frontend is successfully deployed and sending API requests to Supabase, but the database schema, RPC functions, and official question papers have not yet been applied to the live PostgreSQL instance.

---

## 2. Recommended Database Initialization: Single-Script Execution

To eliminate ordering conflicts or missed steps, we have prepared a single, consolidated, idempotent master script:
[`supabase/COMPLETE_PRODUCTION_SETUP.sql`](file:///supabase/COMPLETE_PRODUCTION_SETUP.sql).

### Execution Steps:
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/ckxqkaawbntpaycagrlu).
2. Click **SQL Editor** in the left navigation sidebar.
3. Click **+ New query**.
4. Open [`supabase/COMPLETE_PRODUCTION_SETUP.sql`](file:///supabase/COMPLETE_PRODUCTION_SETUP.sql), copy its entire contents, and paste it into the SQL Editor.
5. Click **Run** (green button or press `Ctrl + Enter` / `Cmd + Enter`).
6. Confirm the execution output says `Success. No rows returned` (executed in ~1.5 seconds).

### What This Script Installs in One Step:
- **Core Tables:** `competitions`, `rounds`, `questions`, `question_options`, `participants` (with 256-bit `session_token`), `submissions`, `exam_attempts`, `admin_roles`.
- **Default Competition:** Bootstraps competition `QUIZ-2026` in status `registration_open`.
- **Rounds 1 & 2:** Initializes General Paper (Round 1) and Python Subject Paper (Round 2).
- **Official 20 Questions & 80 Options:** Seeds all questions from `Generalpaper.docx` and `Subjectpaper.docx` with answer keys securely stored in `question_options`.
- **Row Level Security (RLS) & Table Grants:**
  - Revokes direct public access on `question_options` (prevents answer leaks).
  - Enforces public access through client view `v_client_questions`.
  - **Hardened RLS on `exam_attempts` and `admin_roles`:** Denies public/anon direct `SELECT` and table operations (`REVOKE ALL FROM anon, public`), stopping candidate snooping. Direct access is restricted to authenticated admins and service role.
- **Server-Authoritative Stored Procedures (RPCs with Cryptographic Ownership Validation):**
  - `register_participant`: Exact frontend signature. If candidate is duplicate, returns `is_duplicate: true, success: false` without exposing access codes or tokens (anti-hijacking).
  - `authenticate_participant`: Candidate session recovery via secret 6-character `access_code`.
  - `start_or_restore_attempt`: Idempotent session recovery requiring `p_access_token`. Initializes 20s countdown for Question 1.
  - `start_question_timer_rpc`: Authoritative 20s question timer in PostgreSQL. Recovers running timer on reload without resetting.
  - `save_attempt_answer`: Atomic answer persistence enforcing participant ownership and strict 20-second deadline (+ 1.5s network grace buffer). Rejects late submissions with `is_expired: true`.
  - `submit_exam_attempt_rpc`: Server-side scoring against `question_options.is_correct` with ownership verification.
  - `record_fullscreen_event`: Telemetry logging requiring `p_access_token`.
  - `get_leaderboard`: Multi-tier tie-breaking leaderboard matching frontend interface.
  - `verify_admin_role_rpc`: Server-side RBAC role verification against `auth.uid()`.

---

## 3. Alternative: Ordered Migration Set Execution

If you prefer applying migrations as individual discrete steps:

| Step | File | Purpose |
| :--- | :--- | :--- |
| **Step 1** | [`supabase/migrations/20261111_init_quizmania.sql`](file:///supabase/migrations/20261111_init_quizmania.sql) | Core schema, base competition, rounds, and `get_server_time` RPC. |
| **Step 2** | [`supabase/seed.sql`](file:///supabase/seed.sql) | Seeds 20 questions and options idempotently (`ON CONFLICT DO NOTHING`, zero `TRUNCATE`). |
| **Step 3** | [`supabase/migrations/20261111_production_remediation.sql`](file:///supabase/migrations/20261111_production_remediation.sql) | Creates `exam_attempts`, `admin_roles`, hardened RLS policies, and all 7 authoritative RPCs. |

Execute each script sequentially in the Supabase **SQL Editor**.

---

## 4. Admin Account Onboarding (Supabase Auth)

Because admin passwords are no longer hardcoded into client code, an administrator account must be created in Supabase Auth and mapped to the `admin_roles` table:

### Step 4.1: Create Admin User in Supabase Auth
1. In the Supabase Dashboard, go to **Authentication -> Users**.
2. Click **Add User -> Create User**.
3. Enter your administrator email (e.g., `admin@quizmania.org`).
4. Enter a strong, high-entropy password (e.g., `AdminSecure2026!#`).
5. Toggle **Auto Confirm User** to **ON** (so email verification is not required).
6. Click **Create User**.

### Step 4.2: Grant Admin Role in PostgreSQL
1. Return to **SQL Editor** in the Supabase Dashboard.
2. Run this query (replace `admin@quizmania.org` with the email you used):
   ```sql
   INSERT INTO public.admin_roles (user_id, role, email, granted_by)
   SELECT id, 'SUPERADMIN', email, 'Initial Deployment'
   FROM auth.users
   WHERE email = 'admin@quizmania.org'
   ON CONFLICT (user_id) DO UPDATE SET role = 'SUPERADMIN';
   ```
3. Test login: Open your live website at `https://[YOUR_VERCEL_DOMAIN]/#admin` and sign in using `admin@quizmania.org` and your password.

---

## 5. Environment Variables on Vercel

Ensure these two variables are configured in Vercel (**Project Settings -> Environment Variables**):

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://ckxqkaawbntpaycagrlu.supabase.co` | Supabase Cloud API Gateway endpoint |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (Your project's public anon key) | Client-safe API access token |

*(Remember: Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel client environment variables).*

---

## 6. Table Editor Verification (Confirmation Checklist)

After executing the setup script, navigate to **Table Editor** in the Supabase Dashboard:

- [ ] `competitions` — 1 row (`QUIZ-2026`, status `registration_open`).
- [ ] `rounds` — 2 rows (`round-1` General Paper, `round-2` Subject Paper).
- [ ] `questions` — 20 rows (10 for Round 1, 10 for Round 2).
- [ ] `question_options` — 80 rows (4 options per question).
- [ ] `participants` — Ready to receive candidate check-ins.
- [ ] `submissions` — Ready to receive answer evaluations.
- [ ] `exam_attempts` — Ready to track per-device attempt states.
- [ ] `admin_roles` — 1 row containing your admin user.
