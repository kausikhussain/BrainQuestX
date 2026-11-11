# Quizmania System Architecture Specification

## 1. Executive Architecture Summary

Quizmania is architected as an **authoritative-backend, thin-client examination engine**.
Unlike recreational quiz applications that trust client clocks or broadcast high-frequency countdown ticks over WebSockets, Quizmania relies on:
1. **Clock synchronization** with estimated server drift ($\Delta = t_{\text{server}} - t_{\text{client}}$).
2. **Deterministic deadlines** published once per question.
3. **Local continuous rendering** of countdown using `requestAnimationFrame`.
4. **Server-side deadline verification** upon answer arrival.

```
┌────────────────┐                     ┌────────────────────────────┐
│ Admin Console  │                     │   Authoritative Backend    │
│ (Controller)   │                     │  (Supabase / PostgreSQL)   │
└───────┬────────┘                     └─────────────┬──────────────┘
        │ 1. Release Question i                      │
        ├───────────────────────────────────────────>│ Sets start_time = now()
        │                                            │ Sets deadline = now() + 20s
        │                                            │
        │ 2. Broadcasts Event via Realtime Channel   │
        │<───────────────────────────────────────────┤
        │                                            │
┌───────┴────────┐                                   │
│ Student Portal │                                   │
│ (60+ Clients)  │                                   │
└───────┬────────┘                                   │
        │ 3. Receives event: calculates remaining   │
        │    remaining = deadline - estimated_time   │
        │                                            │
        │ 4. Taps Option Card (Lock Answer)          │
        ├───────────────────────────────────────────>│ 5. Validates:
        │                                            │    - Competition in progress
        │                                            │    - Question matches current
        │                                            │    - now() <= deadline + 500ms
        │                                            │    - Unique(question_id, student_id)
        │ 6. Response: { success: true }             │
        │<───────────────────────────────────────────┤
```

---

## 2. Server-Authoritative Timer Implementation

### The Problem with Client Timers
Traditional web quizzes rely on `setInterval(() => setTimer(t - 1), 1000)`. This pattern fails in competitive scenarios because:
- Browsers throttle background tabs to 1 execution per second or slower.
- Users can manipulate JavaScript execution via browser developer tools.
- Network latency causes clients to start at differing moments.

### Quizmania's Mathematical Solution
When Question $k$ is released:
$$\text{Deadline} = T_{\text{server\_release}} + 20.000\,\text{seconds}$$

During the handshake, the client calculates its clock offset:
$$\Delta = T_{\text{server}} - \left(T_{\text{client\_send}} + \frac{T_{\text{client\_receive}} - T_{\text{client\_send}}}{2}\right)$$

At any point in time $t_{\text{client}}$, the exact remaining time is:
$$\text{Remaining}(t) = \max\left(0,\, \text{Deadline} - (t_{\text{client}} + \Delta)\right)$$

### Visual Alert Phases
- **Normal Phase ($20\text{s} \ge t > 5\text{s}$):** Indigo/Cyan theme, steady linear bar.
- **Warning Phase ($5\text{s} \ge t > 3\text{s}$):** Amber alert border, elevated contrast.
- **Critical Phase ($3\text{s} \ge t > 0\text{s}$):** Crimson alert glow with pulsating border.
- **Expired Phase ($t = 0\text{s}$):** Options lock immediately.

---

## 3. High-Concurrency & Anti-Congestion Strategy

During a 60-student competition, broadcasting countdown updates every second produces:
$$60\,\text{clients} \times 1\,\text{message/sec} \times 20\,\text{sec} = 1,200\,\text{messages/question}$$
For 20 questions, that is $24,000$ Realtime messages, creating connection saturation and lag.

**Quizmania's Low-Overhead Strategy:**
- Realtime messages are sent **only on state transitions** (1 message when a question starts, 1 when a round ends).
- Total Realtime events across the entire 20-question competition: **under 30 messages**.
- Answers are submitted as direct HTTPS/RPC POST requests with indexed write operations.

---

## 4. Deterministic Tie-Breaking Algorithm

Ranks are computed strictly without human bias using the following cascade:

1. **Total Points Awarded:** Candidate with highest overall points ranks higher.
2. **Round 2 (Subject Paper) Score:** Tests mastery of core technical subject matter (Python Programming).
3. **Total Latency / Response Speed:** Sum of server-recorded completion times across correct answers (lower is better).
4. **Shared Rank:** If two candidates possess identical total score, identical Round 2 score, and identical speed down to the millisecond, they are awarded the same dense rank.

---

## 5. Security & Isolation

- **Correct Answer Secrecy:** Public queries utilize the view `v_client_questions` which strips `is_correct` and answer keys.
- **Submission Idempotency:** The database enforces a `UNIQUE(question_id, participant_id)` constraint. Attempting to submit twice returns `{ already_submitted: true }` and does not mutate records.
- **Admin Passkey Gate:** The administrator panel requires administrative authorization before destructive actions or state transitions can be initiated.
