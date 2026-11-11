# QUIZMANIA PRODUCTION DEPLOYMENT AUDIT REPORT

**Date:** 2026-11-11  
**Target Architecture:** Vercel (Frontend SPA) + Supabase Cloud (PostgreSQL 15+, Realtime) + GitHub  
**Audit Objective:** Rigorous source code, security, and infrastructure inspection for 50–60 simultaneous student devices.  
**Audit Status:** ⚠️ **BLOCKED FOR MULTI-DEVICE CLOUD PRODUCTION (Remediation Required Before Live Event)**

---

## 1. Verified Architecture

```mermaid
flowchart TD
    subgraph Client ["Student Devices (50-60 Phones / Tablets)"]
        SP[Student Portal - Vercel HTTPS]
    end

    subgraph AdminDisplay ["Organizer Controls"]
        AD[Admin Dashboard]
        PL[Projector Leaderboard]
    end

    subgraph CloudHosting ["Vercel Edge Network"]
        V[Vite 6 SPA / dist]
        VJ[vercel.json SPA Rewrites]
    end

    subgraph SupabaseCloud ["Supabase Cloud (ap-south-1 Mumbai)"]
        DB[(PostgreSQL 15+)]
        RLS[Row Level Security Engine]
        RPC[Authoritative RPCs]
        RT[Realtime Channels]
    end

    SP -->|HTTPS / Static Assets| V
    AD -->|HTTPS / Static Assets| V
    PL -->|HTTPS / Static Assets| V
    
    SP -.->|Direct Supabase Client (RPC)| RPC
    RPC -->|SECURITY DEFINER| DB
    DB -->|State Broadcast| RT
    RT -.->|Listen Transitions| SP
    RT -.->|Listen Transitions| PL
```

### Verified Components:
- **Build System:** Vite v6.4.6 + TypeScript v5.7.2 + Tailwind CSS v4.0.6. Build outputs cleanly to `dist/` (414 kB JS, 67 kB CSS, gzip ~112 kB).
- **Vercel Routing:** Added `vercel.json` with wildcard SPA routing (`/(.*) -> /index.html`) to prevent 404s on browser reloads.
- **Audio Synthesizer:** Pure Web Audio API in `src/utils/audio.ts` (100% offline, zero network dependencies).
- **Automated Test Matrix:** All 7 test suites pass in Node.js (Evaluation, 5-stage student journey, admin RBAC simulation, question shuffling, 20s timers, full-screen telemetry, 60-participant concurrency).

---

## 2. Required Environment Variables

The production deployment requires **strictly two** client-facing variables configured in the Vercel Project Settings:

| Environment Variable | Description | Security Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | The Supabase Cloud project REST & WebSocket URL (e.g., `https://xyzcompany.supabase.co`). | **Public** (Embedded in client bundle). |
| `VITE_SUPABASE_ANON_KEY` | The public publishable API key for Supabase. | **Public** (Embedded in client bundle; guarded by PostgreSQL RLS). |

### Variables Removed / Banned from Frontend:
- `VITE_ADMIN_PIN`: **REMOVED.** Any variable prefixed with `VITE_` is compiled into the client JavaScript bundle. Storing administrative secrets or master PINs in client-side environment variables is completely insecure.
- `SUPABASE_SERVICE_ROLE_KEY`: **STRICTLY PROHIBITED IN VERCEL.** Must never be added to Vercel or frontend code, as it bypasses all Row Level Security policies.

---

## 3. Critical Security & Architecture Findings

### Finding 1: Full Question Bank & Correct Answer Keys Exposed in Client JS Bundle (HIGH SEVERITY)
- **Location:** [`src/data/questions.ts`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/data/questions.ts) (lines 114–420) & [`src/services/competitionService.ts`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/services/competitionService.ts) (line 21).
- **Observed Behavior:** `SERVER_QUESTION_BANK` contains the raw questions, options, `isCorrect: true`, `correctOptionId`, and `explanation` for all 20 questions of both Round 1 and Round 2. Because `competitionService.ts` imports `SERVER_QUESTION_BANK` to compute local exam scores, Vite bundles the entire dataset into the production bundle (`dist/assets/index-*.js`).
- **Impact:** Any student with basic browser knowledge can open Chrome DevTools (or view source on mobile via `view-source:`) and search for `correctOptionId` to obtain 100% of the answers before answering.
- **Required Remediation:** Remove `SERVER_QUESTION_BANK` from the frontend source tree. All scoring and correct answer keys must reside strictly within PostgreSQL tables in Supabase, accessible only by stored procedures (`SECURITY DEFINER`).

---

### Finding 2: Hardcoded Administrator Passwords in Client JavaScript (HIGH SEVERITY)
- **Location:** [`src/services/competitionService.ts`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/services/competitionService.ts) (lines 1345–1347).
- **Observed Behavior:** The newer "RBAC" authentication function contains a static array of valid administrator passwords. When running `npm run build`, these strings are compiled directly into the static output:
  ```text
  dist\assets\index-*.js: ...H=["[REDACTED_ADMIN_PASSWORDS]"],A=r==="admin"||r==="organizer"...
  ```
- **Impact:** Anyone visiting the public website can extract the administrator credentials from the JavaScript bundle and unlock the admin console.
- **Required Remediation:** Migrate admin authentication to Supabase Auth (`supabase.auth.signInWithPassword`) or a serverless Edge Function with a secret key verified on the server.

---

### Finding 3: Pseudo-RBAC Operates Exclusively in Browser Memory (HIGH SEVERITY)
- **Location:** [`src/services/competitionService.ts`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/services/competitionService.ts) (lines 1366–1418).
- **Observed Behavior:** Admin session tokens (`agt_...`) and audit logs are generated and validated in client-side TypeScript and stored in browser `localStorage`.
- **Impact:** The security boundary is cosmetic. Calling `localStorage.setItem('quizmania_admin_sessions', ...)` or modifying local state grants administrative privileges. The PostgreSQL database does not validate these tokens.

---

### Finding 4: In-Memory / LocalStorage Fallback Silently Traps Student Answers on Phones (CRITICAL BLOCKER)
- **Location:** [`src/components/StudentPortal/ExamWorkspace.tsx`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/components/StudentPortal/ExamWorkspace.tsx) & [`src/services/competitionService.ts`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/src/services/competitionService.ts) (lines 542–856).
- **Observed Behavior:** In the updated examination workflow (`ExamWorkspace.tsx`), student answers, timestamps, and final exam submissions (`submitExamAttempt()`) write exclusively to `this.examAttempts` and `this.submissions` inside `localStorage`. **They do not execute Supabase database writes.**
- **Impact on 60-Student Deployment:**
  - `BroadcastChannel` and `localStorage` only function between tabs on the **same physical device**.
  - If 60 students open the Vercel link on their individual mobile phones, their submissions will be saved only on their respective phones.
  - The central Supabase database and the organizer's laptop dashboard will register **zero submissions** and an empty leaderboard.
- **Required Remediation:** `ExamWorkspace.tsx` and `submitExamAttempt()` must invoke the server-authoritative Supabase RPC (`submit_student_answer` or a batch exam submission RPC) to write responses directly to PostgreSQL.

---

### Finding 5: Initial Database Migration Lacked Row Level Security (RLS) (RESOLVED)
- **Location:** [`supabase/migrations/20261111_init_quizmania.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/migrations/20261111_init_quizmania.sql).
- **Observed Behavior:** The initial migration created tables without `ENABLE ROW LEVEL SECURITY`.
- **Remediation Implemented:** Authored and verified [`supabase/migrations/20261111_rls_security_hardening.sql`](file:///c:/Users/kunal%20sanga/Desktop/Quizmania/supabase/migrations/20261111_rls_security_hardening.sql):
  - Enabled RLS across all tables (`competitions`, `rounds`, `questions`, `question_options`, `participants`, `submissions`).
  - Revoked public `SELECT` on `question_options`.
  - Allowed candidates to query questions only via the secure `v_client_questions` view.
  - Enforced that writes occur only via `SECURITY DEFINER` stored procedures.

---

## 4. Production Deployment Instructions

### Phase A: Supabase Cloud Provisioning
1. Create a project at [supabase.com](https://supabase.com) in region `ap-south-1` (Mumbai).
2. Open the **SQL Editor** and execute in order:
   - `supabase/migrations/20261111_init_quizmania.sql` (Creates schema & functions)
   - `supabase/migrations/20261111_rls_security_hardening.sql` (Enables RLS & permission locks)
   - `supabase/seed.sql` (Seeds 20 official questions and rounds)
3. Copy **Project URL** and **anon public key** from **Project Settings -> API**.

### Phase B: Vercel Deployment
1. Import repository `kunalsanga/quizmania` into [Vercel](https://vercel.com/new).
2. Set Framework to **Vite**, Root Directory to `./`.
3. Add Environment Variables:
   - `VITE_SUPABASE_URL` = `<your-project-url>`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
4. Deploy.

---

## 5. Summary of Remaining Production Blockers

| Blocker | Severity | Description | Action Required |
|---|---|---|---|
| **Answer Key in Bundle** | High | `SERVER_QUESTION_BANK` is compiled into `dist/assets/index-*.js`. | Remove server answer keys from client repository; score strictly in PostgreSQL. |
| **Hardcoded Admin Passwords** | High | Admin passwords compiled into client bundle. | Authenticate via Supabase Auth or backend RPC. |
| **Local-Only Exam Storage** | Critical | `ExamWorkspace.tsx` saves to phone's `localStorage` instead of Supabase. | Connect `submitExamAttempt()` to Supabase PostgreSQL table writes. |

*Report generated and validated against actual local source code and compiled assets.*
