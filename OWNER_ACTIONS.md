# QUIZMANIA — OWNER ACTION GUIDE & OPERATIONAL MANUAL
**Platform:** QuizMania Ultra-Premium School Examination Platform  
**Target:** Competition Director, Event Organizers, and Technical Leads  
**Version:** 2.1 (Two-Round Secure Edition)  

---

## 1. Quick Verification & Running the Platform

Your platform is completely built, verified, and running on your local machine:

```bash
cd Quizmania/quizmania
npm run dev
```

- **Local Access:** [http://localhost:3000](http://localhost:3000)
- **Local Network Access (Wi-Fi/LAN):** `http://<your-local-ip>:3000` (e.g. `http://172.20.33.103:3000`)

---

## 2. Platform Routes & Administrator Credentials

| Interface | URL Route | Access Credentials / Notes |
|---|---|---|
| **Student Examination Portal** | [http://localhost:3000/#](http://localhost:3000/#) | Open to students (requires Name, School, Class 11th or 12th). |
| **Admin Management Console** | [http://localhost:3000/#admin](http://localhost:3000/#admin) | **Username:** `admin`<br>**Password:** `Admin@QuizMania2026` *(or legacy `admin123` / `quizmania2026`)*. |
| **Public Leaderboard** | [http://localhost:3000/#leaderboard](http://localhost:3000/#leaderboard) | Live rankings & podium with Projector Mode. |
| **Auditorium Projector View** | Click *"Projector Mode"* on Leaderboard | High-contrast, large-typography hall display. |

---

## 3. Key Administrative Capabilities in Admin Console

1. **Secure Session Badge & Sign-Out:** Authenticates via 64-character session tokens with 5-failure brute-force defense. Click *"Sign Out of Admin"* to immediately revoke the session.
2. **Candidate Lifecycle Control:** Toggle candidate registration between **Open** and **Closed**.
3. **Full-Screen Telemetry Monitoring:** The Candidate Roster features a dedicated **Fullscreen Exits** column (`0 Exits` green badge, or `N Exits` amber badge). Click any candidate to open the **Student Audit Modal** to view exact exit timestamps.
4. **Question-by-Question Scoring Audit:** Inspect any student's answer selection vs the authoritative answer key with complete rationale.
5. **Shortlist Cutoff Configuration:** Click 50%, 60%, 70%, or 80% to dynamically adjust the Round 2 qualification threshold.
6. **Rehearsal Simulation:** Click *"+ Seed 60 Rehearsal Candidates"* to populate realistic test data and verify scoreboard responsiveness.
7. **CSV Export:** Download complete official results spreadsheet with one click.
8. **Reset Competition:** Wipe all session data and reset scores using the protected phrase `RESET COMPETITION`.

---

## 4. Running the Complete Automated Test Suite

All 7 test suites can be executed via:

```bash
cd quizmania
npm test
```

Specific test targets:
- `npm run test:security`: Admin authentication, token verification, and brute-force lockout.
- `npm run test:shuffling`: 20-candidate Fisher-Yates randomization, uniqueness, and reload persistence.
- `npm run test:timer`: Strict 20-second per-question deadline enforcement and automatic advancement.
- `npm run test:fullscreen`: Full-screen exit tracking and absence of unfair automatic disqualification.
- `npm run test:eval`: Official scoring formulas, boundary cutoffs, and tie-breakers.
- `npm run test:journey`: 5-stage complete student lifecycle.
- `npm run test:concurrency`: 60-student parallel registration and simultaneous submit stress tests.
- `npm run test:e2e`: Headless browser visual regression and screenshot capture suite.

---

## 5. Visual Test Assets

10 full-resolution screenshots are stored in `quizmania/screenshots/`:
- `00_landing_page.png`
- `01_student_registration.png`
- `02_candidate_welcome.png`
- `03_exam_instructions.png`
- `04_exam_workspace_20s_timer.png`
- `05_question_selected.png`
- `06_exam_result_view.png`
- `07_public_leaderboard.png`
- `08_admin_signin_gate.png`
- `09_admin_dashboard_authenticated.png`
