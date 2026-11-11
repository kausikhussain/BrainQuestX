# QUIZMANIA — OFFICIAL MARKING SCHEME & EVALUATION POLICY
**Specification Version:** 2.0  
**Authority:** Technical Assessment Committee & Examination Engine

---

## 1. Official Marking Scheme Matrix

| Parameter | Round 1 (General Paper) | Round 2 (Subject Paper) | Combined Aggregate |
|---|---|---|---|
| **Total Questions** | 10 | 10 | 20 |
| **Marks Per Correct Answer** | **+10 Marks** | **+10 Marks** | **+10 Marks** |
| **Marks For Incorrect Answer** | **0 Marks** | **0 Marks** | **0 Marks** |
| **Negative Marking Enabled** | **False (0 Penalty)** | **False (0 Penalty)** | **False** |
| **Marks For Unanswered Questions** | **0 Marks** | **0 Marks** | **0 Marks** |
| **Maximum Marks Per Round** | **100 Marks** | **100 Marks** | **200 Marks** |
| **Qualifying Cutoff Threshold** | **60% (60 Marks)** | N/A (Final Stage) | N/A |

---

## 2. Mathematical Scoring Formulas

### A. Question-Level Scoring
For each question $q_i \in Q$:
$$\text{Score}(q_i) = \begin{cases} 
M_{\text{correct}} & \text{if candidate answer } = \text{correct answer} \\
- M_{\text{negative}} & \text{if candidate answer } \ne \text{correct answer and } \text{negative enabled} \\
0 & \text{if candidate answer is empty or unanswered}
\end{cases}$$

### B. Round-Level Obtained Marks
$$\text{Obtained Marks} = \sum_{i=1}^{N} \text{Score}(q_i)$$

### C. Maximum Possible Marks
$$\text{Maximum Marks} = \sum_{i=1}^{N} M_{\text{max}}(q_i)\quad (10 \times 10 = 100\text{ Pts})$$

### D. Percentage Calculation & Rounding Policy
$$\text{Percentage} = \begin{cases}
\text{round}\left(\frac{\text{Obtained Marks}}{\text{Maximum Marks}} \times 100,\, 1\right) & \text{if Maximum Marks} > 0 \\
0 & \text{if Maximum Marks} = 0
\end{cases}$$

> [!NOTE]
> Floating-point calculations are rounded using deterministic decimal normalization (`Math.round(val * 10) / 10`) to eliminate IEEE 754 precision artifacts.

---

## 3. Score Safeguards & Integrity Rules

1. **Server-Side Evaluation:** Answers are sent as `{ questionId, selectedOptionId }`. Evaluation occurs exclusively in `competitionService.ts` against `SERVER_QUESTION_BANK`. The frontend never sends or calculates official marks.
2. **Idempotency Guarantee:** Duplicate submissions for the same question within the same attempt are safely detected and ignored without incrementing marks.
3. **No Modification Post-Submission:** Once the pre-submission confirmation dialog is executed or the 10-minute timer expires, all question options are permanently locked from modifications.

