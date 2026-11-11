# QUIZMANIA — SCORING ENGINE & RANKING ALGORITHM
**Specification Version:** 2.0  
**Domain:** Deterministic Multi-Round Evaluation & Ranking

---

## 1. Unified Overall Ranking Mandate

> [!IMPORTANT]
> **Cross-School & Cross-Class Policy:** The tournament leaderboard and rankings are calculated across **all eligible participating students combined into one authoritative list**. Students in Class 11th and Class 12th from all schools compete in the same unified standing.

Separate class-wise or school-wise leaderboards are intentionally disabled in the primary student and public views to maintain tournament-level integrity.

---

## 2. Deterministic Tie-Breaking Algorithm

When sorting candidates into official ranks, the ranking engine executes the following multi-tiered tie-breaking procedure:

```
┌──────────────────────────────────────────┐
│  Tier 1: Total Obtained Score (Higher)   │
└────────────────────┬─────────────────────┘
                     ▼ (If Tied)
┌──────────────────────────────────────────┐
│  Tier 2: Round 2 (Python) Score (Higher) │
└────────────────────┬─────────────────────┘
                     ▼ (If Tied)
┌──────────────────────────────────────────┐
│  Tier 3: Round 1 (General) Score (Higher)│
└────────────────────┬─────────────────────┘
                     ▼ (If Tied)
┌──────────────────────────────────────────┐
│  Tier 4: Total Correct Latency (Faster)  │
└────────────────────┬─────────────────────┘
                     ▼ (If Tied)
┌──────────────────────────────────────────┐
│  Tier 5: Student Name (Alphabetical)     │
└──────────────────────────────────────────┘
```

### Dense Rank Assignment
Candidates identical across all scoring metrics and speed down to the millisecond share the identical dense rank (e.g. Tied #2). The subsequent candidate receives the next logical rank without skipping.

---

## 3. Leaderboard Presentation Specification

The overall leaderboard provides:
1. **Auditorium Projector Mode:** Fullscreen, high-contrast display with large typography for hall projection screens.
2. **Podium Visualization:** Top 3 winners with gold, silver, and bronze pedestals and confetti triggers upon result publication.
3. **Reactive Standings Table:**
   - **Rank:** Numeric badge with podium gold/silver/bronze styling for top 3.
   - **Candidate Name:** Full student name.
   - **School / Institution:** Official school affiliation.
   - **Round 1 (General):** Obtained marks out of 100.
   - **Round 2 (Python):** Obtained marks out of 100.
   - **Total Points:** Aggregate score out of 200.
   - **Correct Answers:** Total verified questions answered correctly.
   - **Qualification Status:** Green `Qualified` pill or neutral `Participated` badge.

