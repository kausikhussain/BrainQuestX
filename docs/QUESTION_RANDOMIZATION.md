# QUESTION RANDOMIZATION SPECIFICATION & PERSISTENCE ARCHITECTURE
**Document Version:** 2.1 (Two-Round Secure Edition)  
**Status:** Implemented & Verified  

---

## 1. Core Principle & Objective

To ensure absolute competitive integrity in an inter-school environment, **every candidate receives an independently randomized question sequence**.

No two adjacent candidates will see questions in the same order. For 10 questions per paper, there are:

$$10! = 3,628,800 \text{ possible permutations}$$

---

## 2. Server-Side Randomization Engine

The sequence is generated exclusively on the trusted examination engine via the Fisher-Yates algorithm with entropy validation.

### Algorithm Flow
1. **Paper Isolation:**
   - **Round 1:** Loads exclusively General Paper questions (`r1-q1` to `r1-q10`).
   - **Round 2:** Loads exclusively Subject Paper questions (`r2-q1` to `r2-q10`).
2. **Cohort Uniqueness Check:**
   - Active assigned sequences for the round are checked.
   - If a newly shuffled sequence collides with an existing candidate's sequence, the engine reshuffles up to 100 times to guarantee a unique permutation.
3. **Sequence Storage:**
   - The accepted array of immutable Question IDs (e.g. `['r1-q4', 'r1-q1', 'r1-q8', ...]`) is persisted inside the candidate's `StudentExamAttempt` record.
4. **Client Delivery:**
   - Client-safe question payloads are served in the exact assigned order with all correct answer fields completely stripped.

---

## 3. Strict Persistence Guarantee (Zero Re-Shuffling on Refresh)

A critical vulnerability in naive quiz platforms is re-shuffling upon page refresh or network reconnection.

### QuizMania Safeguards
- When `startExamAttempt(participantId, roundNumber)` is called on page load or refresh:
  1. The engine checks if an existing unsubmitted attempt exists for `(participantId, roundNumber)`.
  2. If found, **the existing attempt and its assigned `questionSequence` are restored directly**.
  3. The active question index and timer are re-synchronized.
  4. The sequence **never** re-shuffles.

---

## 4. Immutable ID Evaluation (Position Independence)

Scoring never evaluates based on displayed position (e.g. "Question 1") or option letter alone:

$$\text{Candidate Response} \longrightarrow \text{Immutable Question ID} \longrightarrow \text{Selected Option ID} \longleftrightarrow \text{Authoritative Answer Key}$$

Even if Question 8 from the source paper appears as Question 1 for Student A and Question 7 for Student B, each question's evaluation is keyed strictly to `q.id === 'r1-q8'`.

---

## 5. Automated Verification Results

Covered by `scripts/test-question-shuffling.cjs` in the continuous integration suite:
- **Test 1 (Cohort Uniqueness):** 20 distinct simulated students yielded 20 unique permutations (100% uniqueness).
- **Test 2 (Persistence):** Reloading attempts preserved 100% of question sequences and pre-selected answers.
- **Test 3 (Evaluation Integrity):** Full score of 100/100 verified under randomized sequences.
- **Test 4 (Paper Isolation):** Zero cross-contamination between Round 1 and Round 2.

