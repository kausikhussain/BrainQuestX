# QUIZMANIA — COMPLETE STUDENT EXAMINATION JOURNEY
**Version:** 2.0  
**Specification:** End-to-End Architectural and UX Lifecycle

---

## Journey Architecture Flowchart

```
┌─────────────────────────────────┐
│     PAGE 01: STUDENT LOGIN      │
│  Name • School • Class (11/12)  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│    PAGE 02: CANDIDATE BRIEF     │
│  Verified Profile & Overview    │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│    PAGE 03: EXAM INSTRUCTIONS   │
│ Rules • Format • Mandatory Gate │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│    PAGE 04: EXAM WORKSPACE      │
│ 10 Questions • Palette • Timer  │
│  Review Flags • Auto-Save Sync  │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│      SUBMISSION MODAL GATE      │
│ Telemetry Summary • Double-Lock │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│    PAGE 05: RESULTS & OUTCOME   │
│  Score (0-100) • Time • Details │
└───────┬─────────────────┬───────┘
        │                 │
 (Score >= 60%)     (Score < 60%)
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ QUALIFIED    │   │ PARTICIPATED │
│  FOR ROUND 2 │   │ Feedback &   │
│ Direct Start │   │ Standings    │
└───────┬──────┘   └──────────────┘
        │
        ▼
┌─────────────────────────────────┐
│   ROUND 2: SUBJECT PAPER (PY)   │
│ 10 Questions • Final Ranking    │
└─────────────────────────────────┘
```

---

## Detailed Step-by-Step Stage Breakdown

### Stage 1: Student Login & Registration (`RegistrationView.tsx`)
- **Inputs:** Student Full Name, School / Institution Name, Academic Standard (`Class 11th` or `Class 12th`).
- **Validation:**
  - Full Name requires $\ge 2$ characters.
  - School Name is mandatory.
  - Enforces duplicate resolution (restoring active student if already registered).
- **Session Badge:** Assigns unique access ID (e.g. `QZ-A1B2C3`) and stores verified session in `localStorage`.

### Stage 2: Candidate Welcome Briefing (`ExamWelcomeView.tsx`)
- Displays student name, verified badge, school name, class, and official access code.
- Outlines the 2-Round competition structure:
  - **Round 1:** General Paper (10 questions, 10 minutes, 100 points maximum).
  - **Round 2:** Python Subject Paper (unlocked upon qualification).
- Explains authoritative timing and server answer persistence.
- Primary CTA: *"Read Examination Instructions"*.

### Stage 3: Examination Instructions & Mandatory Gate (`ExamInstructionsView.tsx`)
- **Structure Breakdown:** 10 questions, single-choice (A, B, C, D), +10 marks each, 0 for incorrect/unanswered (no negative marking).
- **Rules of Conduct:** Question navigation freedom, review flagging, clear response capabilities.
- **Timer Protocol:** Authoritative countdown (10 minutes) running continuously without refresh-reset loopholes.
- **Confirmation Gate:** Interactive checkbox *"I have read, understood, and agree to strictly comply..."*. The CTA *"Start Round 1 Examination"* is strictly disabled until checked.

### Stage 4: Interactive Examination Workspace (`ExamWorkspace.tsx`)
- **Top Header:**
  - Round title & student details.
  - Question progress counter (e.g. `4 of 10 Answered`) with dynamic progress bar.
  - Authoritative digital timer (`MM:SS`) with automatic color transitions:
    - Normal ($> 2$ mins): Slate neutral.
    - Low time ($\le 2$ mins): Amber alert.
    - Critical time ($\le 30$s): Rose pulsing warning.
  - Save status indicator (`Saved to Server` / `Saving...`).
- **Main Question Display:**
  - High-legibility typography with option cards (A, B, C, D).
  - Clear selection state with checkmark badge.
  - Keyboard shortcuts (`A`/`B`/`C`/`D` or `1`/`2`/`3`/`4`).
- **Action Toolbar:**
  - *Previous Question* (navigates back).
  - *Mark for Review* (flags with purple status indicator).
  - *Clear Response* (removes selected answer).
  - *Save & Next* (saves response and moves forward).
- **Question Palette (10 Questions):**
  - Instant visual feedback: Not Visited, Visited Unanswered, Answered, Marked for Review.
  - Direct jump to any question with one click.
  - Responsive collapsible bottom sheet on mobile screens.

### Stage 5: Pre-Submission Verification Modal (`SubmissionModal.tsx`)
- Triggered by clicking *"Submit Examination"* or automatically upon timer reaching `00:00`.
- Summarizes telemetry: Answered count, Unanswered count, Review Flag count.
- Displays prominent warning if unanswered questions remain.
- Actions: *"Continue Examination"* or *"Confirm & Submit"*.
- Locks input and disables repeat clicks to prevent double submissions.

### Stage 6: Result & Qualification Screen (`ExamResultView.tsx`)
- Correct answers evaluated securely against `SERVER_QUESTION_BANK` on the trusted engine.
- Displays: Total Score (out of 100), Correct Count, Incorrect Count, Time Taken.
- **Outcome A — Qualified for Round 2:**
  - Triggered if score $\ge 60\%$ (configurable by organizer in admin panel).
  - Celebratory confetti particles.
  - Direct CTA: *"Proceed to Round 2 Examination"*.
- **Outcome B — Round 1 Completed:**
  - Constructive, respectful appreciation message.
  - Accuracy metrics and link to live tournament leaderboard.

### Stage 7: Round 2 Progression (Python Programming)
- Qualified candidates seamlessly launch Round 2: Python Subject Paper.
- 10 official questions covering syntax, immutability, execution order, built-in functions, and indexing.
- Independent authoritative 10-minute timer.
- Aggregates final score (up to 200 marks total) into the official leaderboard.

