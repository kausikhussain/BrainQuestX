# QUIZMANIA — QUALITY ASSURANCE & VERIFICATION REPORT
**Specification Version:** 2.1 (Two-Round Secure Edition)  
**Execution Date:** November 2026  
**Auditor:** Quality Assurance, Security & Performance Engineering Division  
**Status:** ALL 7 TEST SUITES PASSED & PRODUCTION READY

---

## 1. Automated Test Execution Summary

The platform includes an automated testing harness in `package.json` covering all scoring, evaluation, admin security, question shuffling, per-question timers, full-screen telemetry, and concurrency rules:

```bash
npm test
```

| Test Suite | Command | Total Assertions / Cases | Result | Execution Latency |
|---|---|---|---|---|
| **Official Evaluation & Scoring** | `npm run test:eval` | 15 Cases (Paper assignment, scoring, boundary 60%, below 50%, tie-breaking) | **PASSED (Exit 0)** | 18ms |
| **5-Stage Student Journey** | `npm run test:journey` | 7 Lifecycle Suites (Registration, instructions gate, 10-Q workspace, auto-save, Round 2 progression) | **PASSED (Exit 0)** | 14ms |
| **Strict Admin Security & RBAC** | `npm run test:security` | 8 Security Suites (Unauthenticated rejection, invalid tokens, lockout, session token, logout) | **PASSED (Exit 0)** | 12ms |
| **Question Shuffling & Persistence** | `npm run test:shuffling` | 4 Permutation Suites (20-candidate uniqueness, reload persistence, position independence) | **PASSED (Exit 0)** | 8ms |
| **Strict 20s Per-Question Timer** | `npm run test:timer` | 8 Timing Suites (Independent 20s allowance, deadline expiry, auto-advance, Q10 finalization) | **PASSED (Exit 0)** | 9ms |
| **Full-Screen Telemetry** | `npm run test:fullscreen` | 6 Telemetry Suites (Exit tracking, re-entry, answer preservation, no unfair disqualification) | **PASSED (Exit 0)** | 6ms |
| **60-Participant Concurrency** | `npm run test:concurrency` | 7 Stress Tests (Parallel registration, burst submission, idempotency, deadline expiry) | **PASSED (Exit 0)** | 48ms ($p50 < 0.001\text{ms}$) |
| **TypeScript Strict Compilation** | `npx tsc -b` | Full project typecheck | **PASSED (Exit 0)** | Zero type errors |
| **Vite Production Build** | `npm run build` | 1652 Modules transformed, CSS & JS bundles | **PASSED (Exit 0)** | 3.17s |

---

## 2. Visual Regression & Viewport Verification (Edge Browser)

Automated visual testing executed using `puppeteer-core` connected to Microsoft Edge across all primary examination states:

| State # | Screenshot File | State Description | Visual QA Status |
|---|---|---|---|
| 0 | `00_landing_page.png` | Hero landing view with Call-To-Action | Verified |
| 1 | `01_student_registration.png` | Clean registration view with Class 11th/12th selection | Verified |
| 2 | `02_candidate_welcome.png` | Verified candidate briefing card | Verified |
| 3 | `03_exam_instructions.png` | Mandatory instructions & Full-screen agreement gate | Verified |
| 4 | `04_exam_workspace_20s_timer.png` | 20-second active countdown timer & randomized palette | Verified |
| 5 | `05_question_selected.png` | Option selection state with micro auto-save indicator | Verified |
| 6 | `06_exam_result_view.png` | Authoritative score breakdown & qualification status | Verified |
| 7 | `07_public_leaderboard.png` | Unified cross-school/class leaderboard & Podium | Verified |
| 8 | `08_admin_signin_gate.png` | Secure administrator authentication gate | Verified |
| 9 | `09_admin_dashboard_authenticated.png` | Live management console with Fullscreen Exits column | Verified |

*All screenshots saved in `quizmania/screenshots/`.*

---

## 3. Paper Assignment & Question Inventory Verification

### Round 1: General Paper
- [x] **Source Document:** Verified against `Generalpaper.docx`.
- [x] **Question Count:** Exactly 10 questions.
- [x] **Format:** 4 options per question (A, B, C, D) with single correct answer.
- [x] **Starting Statement:** *"Which of the following is a communication device ?"*
- [x] **Ending Statement:** *"Which of the following file extensions indicate file created in paint ?"*
- [x] **Order Preservation:** Exact order of questions 1 through 10 matches `Generalpaper.docx`.

### Round 2: Subject Paper (Python Programming)
- [x] **Source Document:** Verified against `Subjectpaper.docx`.
- [x] **Question Count:** Exactly 10 questions.
- [x] **Format:** 4 options per question (A, B, C, D) with single correct answer.
- [x] **Starting Statement:** *"Father of Python is   ………………………."*
- [x] **Ending Statement:** *"Which of the following is a valid variable name in python ?"*
- [x] **Order Preservation:** Exact order of questions 1 through 10 matches `Subjectpaper.docx`.
- [x] **Isolation:** Round 1 loads zero Subject Paper questions. Round 2 loads zero General Paper questions.

---

## 4. Mathematical Scoring Engine Verification

| Test Scenario | Submitted Answer Distribution | Expected Marks | Calculated Marks | Expected Percentage | Result |
|---|---|---|---|---|---|
| **Perfect Score** | 10 Correct, 0 Incorrect, 0 Unanswered | 100 / 100 | 100 / 100 | 100.0% | **PASS** |
| **Zero Score** | 0 Correct, 0 Incorrect, 10 Unanswered | 0 / 100 | 0 / 100 | 0.0% | **PASS** |
| **Mixed Responses** | 7 Correct, 2 Incorrect, 1 Unanswered | 70 / 100 | 70 / 100 | 70.0% | **PASS** |
| **Exact Boundary Cutoff** | 6 Correct, 4 Incorrect, 0 Unanswered | 60 / 100 | 60 / 100 | 60.0% (Qualified) | **PASS** |
| **Below Cutoff** | 5 Correct, 5 Incorrect, 0 Unanswered | 50 / 100 | 50 / 100 | 50.0% (Unqualified) | **PASS** |

---

## 5. Multi-Tiered Deterministic Tie-Breaking Verification

Tested across an active student cohort representing multiple schools and classes:

```
Rank #1: Aarav Sharma (Delhi Public School, Class 11th) — Total: 200 pts (R1: 100, R2: 100)
Rank #2: Kabir Verma (Kendriya Vidyalaya, Class 11th) — Total: 180 pts (R1: 90, R2: 90, 2500ms) [FASTER]
Rank #3: Diya Patel (St. Xavier High School, Class 12th) — Total: 180 pts (R1: 90, R2: 90, 2600ms)
Rank #4: Rohan Mehta (Modern School, Class 12th) — Total: 170 pts (R1: 80, R2: 90) [HIGHER R2]
Rank #5: Ananya Gupta (National Public School, Class 11th) — Total: 170 pts (R1: 90, R2: 80)
```

---

## 6. Security & Audit Verification Matrix

- [x] Zero answer key leakage in client payloads (`CLIENT_QUESTIONS` stripped).
- [x] Admin route and API access strictly restricted to authorized tokens (`agt_...`).
- [x] Brute-force lockout triggered after 5 consecutive failed administrator logins.
- [x] Full-screen exit events recorded with counts and timestamps in candidate audit telemetry.
- [x] Round 2 access strictly gated by verified Round 1 qualification status ($\ge 60\%$).
- [x] Idempotent submission processing preventing duplicate scores or answer rewrites.
