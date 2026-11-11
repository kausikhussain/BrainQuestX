# QUIZMANIA — REMAINING REQUIREMENTS & ORGANIZER DECISION LOG
**Status:** Operational Reference & Action Guide  
**Target:** Event Organizers & System Administrators

---

## 1. Configurable Parameters & Active Defaults

The platform has been implemented with production-grade defaults, while empowering event organizers to modify parameters dynamically:

| Parameter | Current Default | Configurable Location | Organizer Action Required? |
|---|---|---|---|
| **Round 1 Qualifying Cutoff** | **60%** (6/10 questions) | Admin Dashboard & `competitionService.ts` | **Optional:** Organizers can click 50%, 60%, 70%, or 80% directly in the Admin Console. |
| **Round Examination Duration** | **10 Minutes** (600s) | `ExamWorkspace.tsx` / `competitionService.ts` | **Confirmed:** Provides 1 minute per technical question with ample review time. |
| **Marking Scheme** | **+10 / 0** (No negative marking) | `questions.ts` | **Confirmed:** Standard for inter-school technical competitions. |
| **Admin Console Access PIN** | `quizmania2026` or `admin123` | `AdminDashboard.tsx` & `.env` | **Recommended:** Change PIN before live public deployment. |

---

## 2. Infrastructure Modes: Local Offline vs. Cloud Sync

QuizMania features a resilient **Dual-Engine Architecture**:

### Option A: Local School Network / Rehearsal Mode (Zero Setup — Active)
- **Engine:** In-Memory + `LocalStorage` + `BroadcastChannel`
- **Network Scope:** Devices on the same browser session or shared local network address (`http://<local-ip>:3000`).
- **Prerequisites:** None. Works with 0 cloud dependencies or API keys.
- **Recommended For:** Single-lab school competitions, stage rehearsals, and network-isolated offline halls.

### Option B: Supabase Cloud Database Mode (Multi-Router / Remote)
- **Engine:** PostgreSQL 14+ with Row Level Security (RLS) and stored procedures.
- **Network Scope:** Internet-wide; students on mobile 4G/5G, different Wi-Fi networks, or different campuses.
- **Prerequisites:** Create free Supabase project, execute `supabase/schema.sql`, and populate `.env`:
  ```bash
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

---

## 3. Tournament Day Operational Checklist

1. **Pre-Event Stage Initialization:**
   - Launch platform (`npm run dev`).
   - Navigate to `http://localhost:3000/#admin` and unlock with `quizmania2026`.
   - Verify candidate registration is set to **Open**.
   - Optional: Click *"+ Seed 60 Rehearsal Candidates"* to verify scoreboard responsiveness, then click *"Reset Competition"* when ready for actual student entry.
2. **Student Onboarding:**
   - Instruct students to open the tournament URL on their desktop or mobile browsers.
   - Students enter their Full Name, School Name, and Class (11th or 12th).
3. **Commencing Round 1 (General Paper):**
   - Students click *"Read Examination Instructions"*, agree to the honor code checkbox, and click *"Start Round 1"*.
   - The authoritative 10-minute countdown begins. Students answer, flag questions for review, and submit.
4. **Qualification & Round 2:**
   - Upon submitting Round 1, students scoring $\ge 60\%$ are immediately presented with the *"Proceed to Round 2 Examination"* gateway.
   - Candidates initiate Round 2 (Python Subject Paper).
5. **Publishing Final Results:**
   - Once all submissions conclude, the organizer clicks *"Publish Official Results to Leaderboard"* in the Admin Console.
   - Projector Mode is launched on the auditorium screen via `http://localhost:3000/#leaderboard`.
   - Organizers click *"Export Official Results (CSV)"* for school records and trophy awards.

