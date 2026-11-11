# QUIZMANIA — ROUND 1 TO ROUND 2 QUALIFICATION RULES
**Specification Version:** 2.0  
**Authority:** Tournament Organizing Committee & Evaluation Service

---

## 1. Official Qualification Policy

The transition from Round 1 (General Paper) to Round 2 (Subject Paper: Python Programming) is governed by an **authoritative percentage cutoff**:

$$\text{Eligible for Round 2} \iff \text{Round 1 Score} \ge \text{Qualifying Cutoff Threshold}\quad (\text{Default: } 60\%)$$

### Key Qualification Rules:
1. **Unified Candidate Pool:** Qualification is determined across all participating students combined. There is no quota by school or by class unless explicitly configured by the tournament organizer.
2. **Tie-at-Cutoff Policy:** All candidates who score at or above the cutoff threshold qualify for Round 2. Candidates with tied scores at the threshold are not arbitrarily dropped.
3. **Strict Gate Enforcement:**
   - Unqualified candidates are prevented from accessing Round 2 by both UI navigation routing and backend validation in `competitionService.ts` (`startExamAttempt(..., 2)` throws an `Access Denied` exception if unqualified).
   - Qualified candidates receive celebratory confetti, a prominent status badge, and a direct button: *"Proceed to Round 2 Examination"*.

---

## 2. Dynamic Organizer Configuration

Organizers can adjust the qualifying cutoff in real-time via the **Admin Management Console** (`/#admin`):

| Preset Cutoff | Minimum Round 1 Marks | Required Correct Answers |
|---|---|---|
| **50%** | 50 Pts | 5 of 10 Questions |
| **60% (Default)** | **60 Pts** | **6 of 10 Questions** |
| **70%** | 70 Pts | 7 of 10 Questions |
| **80%** | 80 Pts | 8 of 10 Questions |

Adjusting the cutoff threshold automatically re-evaluates all student qualification states and updates the live roster and leaderboard instantaneously.

