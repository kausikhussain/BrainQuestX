# QUIZMANIA SYSTEM ARCHITECTURE SPECIFICATION
**Version:** 2.1 (Two-Round Secure Edition)  
**Status:** Implemented & Production-Ready  

---

## 1. Executive Architecture Summary

QuizMania is architected as an **authoritative-backend, thin-client examination engine** specifically built for high-stakes school technical quiz tournaments.

### Core Architectural Pillars:
1. **Strict Paper-to-Round Mapping:**
   - **Round 1:** General Paper (`Generalpaper.docx`, 10 questions on Computer Fundamentals).
   - **Round 2:** Subject Paper (`Subjectpaper.docx`, 10 questions on Python Programming).
2. **Server-Side Unique Question Shuffling:**
   - Every candidate receives an independently randomized question sequence ($10! = 3,628,800$ possible permutations).
   - Sequence uniqueness enforced across the active cohort.
   - Assigned sequence persisted in candidate attempt; **never re-shuffled on refresh**.
3. **Strict 20-Second Per-Question Timer:**
   - Independent 20-second allowance for each question (nominal total: 200 seconds for 10 questions).
   - Authoritative timestamps prevent client clock manipulation.
   - Expiration at 00:00 automatically locks question and advances to the next question in the sequence.
4. **Mandatory Full-Screen Mode & Telemetry:**
   - Full-screen requested on Start Examination click.
   - Exit detection with prominent warning overlay and single-click return.
   - Itemized exit logging with timestamps in audit telemetry.
5. **Role-Based Access Control (RBAC):**
   - Explicit `STUDENT` vs `ADMIN` roles.
   - Cryptographic 64-character session tokens (`agt_...`) with 2-hour expiration.
   - 5-failure brute force lockout defense.
   - All administrative mutations protected server-side.

---

## 2. High-Level System Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│               CLIENT APPLICATION LAYER                 │
│         React 19 • TypeScript • Tailwind CSS 4         │
└───────────────────────────┬────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌───────────────────┐               ┌────────────────────┐
│   Student Portal  │               │  Admin Dashboard   │
│ • Fullscreen Gate │               │ • RBAC Auth Gate   │
│ • 20s Workspace   │               │ • Cutoff Adjuster  │
│ • Palette Stepper │               │ • Telemetry Audit  │
└─────────┬─────────┘               └─────────┬──────────┘
          │                                   │
          ▼                                   ▼
┌────────────────────────────────────────────────────────┐
│                COMPETITION SERVICE CORE                │
│ • Randomization Engine (Fisher-Yates + Cohort Unique)  │
│ • Per-Question 20s Authoritative Timer Machine         │
│ • Scoring Engine (Position-Independent ID Evaluation)   │
│ • Multi-Tier Deterministic Ranker                      │
│ • Full-Screen Telemetry Logger                         │
└───────────────────────────┬────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌───────────────────┐               ┌────────────────────┐
│ Local Sync Engine │               │   Supabase Cloud   │
│ (In-Memory/Storage│               │  (PostgreSQL + RLS │
│ + BroadcastChannel│               │   + RPC Functions) │
└───────────────────┘               └────────────────────┘
```

---

## 3. Server-Authoritative Per-Question Timing Engine

When question $i$ is presented to candidate $C$:
$$\text{firstDisplayedAt} = T_{\text{server}}$$
$$\text{deadlineTime} = T_{\text{server}} + 20,000\text{ms}$$

### Countdown & Lockout Policy:
$$\text{Remaining}(t) = \max\left(0,\, \left\lceil \frac{\text{deadlineTime} - T_{\text{server}}}{1000} \right\rceil\right)$$

- At $\text{Remaining}(t) = 0$:
  1. Engine rejects any further answer modification (`isLocked = true`).
  2. If unselected, records question as **Unanswered**.
  3. Transitions automatically to Question $i + 1$.
  4. Starts Question $i + 1$'s independent 20-second timer.
  5. On Question 10 expiration, finalizes examination attempt and computes score.

---

## 4. Multi-Tier Deterministic Tie-Breaking Algorithm

1. **Tier 1:** Higher Total Marks across both rounds.
2. **Tier 2:** Higher Subject Paper (Round 2 Python) Score.
3. **Tier 3:** Higher General Paper (Round 1) Score.
4. **Tier 4:** Lower Cumulative Correct Response Latency (faster candidate ranked higher).
5. **Tier 5:** Alphabetical Full Name.

---

## 5. Security & Isolation Matrix

| Capability | Student Role | Admin Role |
|---|---|---|
| Paper Access | Stripped Questions (`CLIENT_QUESTIONS`) | Full Bank + Rationales (`SERVER_QUESTION_BANK`) |
| Answer Submission | Allowed during active question timer only | N/A |
| Round 2 Eligibility | Gated by verified Round 1 score ($\ge 60\%$) | Organizer can adjust cutoff |
| Audit Telemetry | View own finalized score & percentage | View question-by-question candidate log + fullscreen exits |
| Competition Reset | Strictly Blocked | Protected by session token (`agt_...`) |
