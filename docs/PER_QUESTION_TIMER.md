# STRICT 20-SECOND PER-QUESTION TIMER SPECIFICATION
**Document Version:** 2.1 (Two-Round Secure Edition)  
**Status:** Implemented & Verified  

---

## 1. Specification Overview

Every question in the examination features an **independent 20-second time limit**:

$$\text{Per-Question Allowance} = 20 \text{ seconds}$$
$$\text{Nominal Total Allowance (10 Questions)} = 10 \times 20\text{s} = 200 \text{ seconds}$$

This is **not** a single 20-second timer for the entire examination. Each question receives its own 20-second window.

---

## 2. Server-Authoritative Timestamp Model

To prevent client clock manipulation or DevTools freezing:

1. **Timer Initialization:**
   When question index $i$ is presented to candidate $C$:
   $$\text{firstDisplayedAt} = T_{\text{server}}$$
   $$\text{deadlineTime} = T_{\text{server}} + 20,000\text{ms}$$
2. **Remaining Time Calculation:**
   $$\text{Remaining Time} = \max\left(0, \left\lceil \frac{\text{deadlineTime} - T_{\text{server}}}{1000} \right\rceil\right)$$
3. **UI Visual States:**
   - **Normal State ($> 6\text{s}$):** Indigo indicator (`00:20` to `00:07`).
   - **Low Time Warning ($3\text{s} - 6\text{s}$):** Amber badge with subtle alert pulse.
   - **Critical Expiration ($\le 2\text{s}$):** High-contrast Rose badge (`00:02`, `00:01`, `00:00`).

---

## 3. Behavior at 00:00 (Automatic Advancement)

When the 20-second timer reaches zero:
1. **Lock Current Question:** Further option modifications are rejected immediately by the backend engine (`isLocked = true`, `isExpired = true`).
2. **Save Selected Response:** If the student selected an option, it is persisted. If no option was selected, it is recorded as **Unanswered**.
3. **Automatic Advance:** The workspace automatically transitions to Question $i + 1$ in the student's assigned randomized sequence. No manual clicks required.
4. **Start Next Timer:** The next question's independent 20-second timer commences.
5. **Question 10 Finalization:** When Question 10 reaches zero (or when the candidate submits), the entire attempt is finalized, scored on the backend, and results are published.

---

## 4. Anti-Tamper & Refresh Recovery

- **Page Reload:** The engine reads the saved `deadlineTime`. If $T_{\text{server}} < \text{deadlineTime}$, the countdown resumes with exact remaining seconds. If $T_{\text{server}} \ge \text{deadlineTime}$, the question is expired and auto-advances.
- **Race Condition Handling:** A 500ms network tolerance buffer is applied. Any answer received after `deadlineTime + 500ms` is permanently rejected with:
  `{ success: false, error: 'Deadline expired. Answer rejected.' }`

---

## 5. Automated Verification Results

Covered by `scripts/test-per-question-timer.cjs`:
- 20-second initial allocation verified.
- Expiration at $t+21\text{s}$ rejected with strict deadline enforcement.
- Automatic advancement on zero seconds verified.
- Unanswered status accurately recorded on expiration.
- Simulated refresh recovered exact remaining seconds without timer reset.
- Final question (Question 10) expiration cleanly completed examination attempt.

