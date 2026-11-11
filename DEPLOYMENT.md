# Quizmania Production Deployment Guide (Vercel + Supabase Cloud)

This guide details the step-by-step production deployment procedure for **Quizmania** using **Vercel** for frontend delivery and **Supabase Cloud (PostgreSQL)** for backend persistence.

---

## 1. Architecture Overview

- **Frontend Hosting:** Vercel (Fast edge network serving static HTML/JS/CSS with HTTPS)
- **Database & Backend:** Supabase Cloud (Managed PostgreSQL 15+ in AWS Mumbai `ap-south-1`)
- **Real-Time Layer:** Supabase Realtime (Broadcasting competition state transitions)
- **Security Layer:** PostgreSQL Row Level Security (RLS) + `SECURITY DEFINER` Stored Procedures (RPCs)

---

## 2. Step 1: Provision Supabase Cloud Project

1. Sign in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and name it `quizmania`.
3. **Region Selection:** Choose a region close to your participants (e.g. `ap-south-1` Mumbai) for minimal network latency (< 25ms round-trip).
4. **Database Password:** Generate a high-entropy database password (save it in your password manager).
5. Wait ~2 minutes for the database cluster to finish provisioning.

---

## 3. Step 2: Apply Database Migrations & Security Hardening

Open the **SQL Editor** in the Supabase Dashboard:

### 3.1 Run Initial Schema & Stored Procedures
1. Open the file [`supabase/migrations/20261111_init_quizmania.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/migrations/20261111_init_quizmania.sql).
2. Paste the SQL into the editor and click **Run**.
3. This creates:
   - Tables: `competitions`, `rounds`, `questions`, `question_options`, `participants`, `submissions`
   - Client view: `v_client_questions` (strips `is_correct`)
   - Authoritative RPCs: `get_server_time`, `register_participant`, `submit_student_answer`, `get_leaderboard`

### 3.2 Apply Row Level Security (RLS) Hardening
1. Open the file [`supabase/migrations/20261111_rls_security_hardening.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/migrations/20261111_rls_security_hardening.sql).
2. Paste the SQL and click **Run**.
3. This enforces:
   - RLS enabled across all tables.
   - Revokes direct `SELECT` on `question_options` from public `anon`.
   - Forces question querying through `v_client_questions`.
   - Protects submissions and participants against unauthorized writes.

### 3.3 Seed the 20 Official Questions
1. Open the file [`supabase/seed.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/seed.sql).
2. Paste the SQL and click **Run**.
3. Confirms:
   - Round 1 (General Paper): 10 questions seeded.
   - Round 2 (Subject Paper - Python): 10 questions seeded.

---

## 4. Step 3: Retrieve API Credentials

Navigate to **Project Settings** -> **API** in the Supabase Dashboard.
Copy the following two values:
- **Project URL:** e.g. `https://xyzcompany.supabase.co`
- **Publishable / anon key:** e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

> ⚠️ **CRITICAL SECURITY WARNING:**  
> Never copy or use the `service_role` (secret) key in the frontend or in Vercel environment variables. The `service_role` key bypasses all Row Level Security and must remain strictly server-side.

---

## 5. Step 4: Deploy to Vercel

1. Log in to [Vercel](https://vercel.com/new).
2. Import the GitHub repository: `https://github.com/kunalsanga/quizmania`.
3. Configure the Project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. In **Environment Variables**, add:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase Cloud REST / Realtime endpoint |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Public / Publishable Anon Key |

5. Click **Deploy**. Vercel will build and output your production domain: `https://quizmania.vercel.app`.

---

## 6. Step 5: Post-Deployment Smoke Test (12-Point Checklist)

Before competition day, complete this live verification checklist on the production URL:

- [ ] **1. Public Page Load:** Open `https://quizmania.vercel.app` on an Android phone and iPhone over 4G/Wi-Fi. Confirm load time < 1.5s.
- [ ] **2. Single Page Routing:** Refresh `https://quizmania.vercel.app/#admin` and `https://quizmania.vercel.app/#leaderboard`. Confirm no 404 errors (handled by `vercel.json`).
- [ ] **3. Candidate Registration:** Register a test student (Name, School, Class 11th). Check the Supabase **Table Editor** under `participants` to confirm the row was persisted in PostgreSQL.
- [ ] **4. Duplicate Protection:** Attempt to register the exact same student twice. Confirm session restoration occurs cleanly.
- [ ] **5. Zero Answer Exposure:** Open browser DevTools Network tab on the candidate device. Inspect `/rest/v1/v_client_questions` and confirm that `is_correct` and answer keys are nowhere in the response payload.
- [ ] **6. Round 1 Launch:** From the Admin Console, initiate Round 1.
- [ ] **7. Question Countdown:** Confirm the 20-second timer displays synchronized across phones.
- [ ] **8. Answer Persistence:** Submit an option. Check the Supabase `submissions` table to confirm the record was stored.
- [ ] **9. Refresh Resilience:** Reload the student's browser tab while answering. Confirm the session recovers the current question and remaining deadline.
- [ ] **10. Deadline Enforcement:** Wait for 20 seconds to elapse. Confirm late submissions are rejected with `Deadline expired`.
- [ ] **11. Results & Podium:** Complete both rounds, publish results from Admin, and inspect the Public Leaderboard.
- [ ] **12. Projector Fullscreen:** Open `/leaderboard` on the auditorium laptop, press **Auditorium Projector Mode**, and confirm high contrast readability under hall lighting.
