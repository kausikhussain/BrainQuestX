# Quizmania Testing & Concurrency Benchmark Report

## 1. Concurrency Stress Test Results

Executed via:
```bash
npm run test:concurrency
```

### Environment:
- **Concurrent Virtual Students:** 60
- **Questions in test cycle:** Round 1 (General Paper) & Round 2 (Python Subject Paper)
- **Burst Pattern:** 60 parallel answer submissions within a single question window.

### Measured Latency & Reliability Metrics:

| Metric | Target | Measured Result | Status |
|---|---|---|---|
| **Successful 60-Student Parallel Registrations** | 60 / 60 | 60 / 60 (100%) | **PASS** |
| **Total Registration Batch Duration** | < 100 ms | 0.70 ms | **PASS** |
| **Duplicate Registration Re-entry** | Session restored | Restored without duplication | **PASS** |
| **Simultaneous Submissions Throughput** | 60 / 60 accepted | 60 / 60 (100%) | **PASS** |
| **Dropped Packets / Submission Errors** | 0.00% | 0.00% | **PASS** |
| **p50 (Median Submission Latency)** | < 50 ms | **0.002 ms** | **PASS** |
| **p90 Submission Latency** | < 100 ms | **0.008 ms** | **PASS** |
| **p95 Submission Latency** | < 150 ms | **0.013 ms** | **PASS** |
| **Max Peak Submission Latency** | < 300 ms | **0.244 ms** | **PASS** |
| **Duplicate Answer Re-submission (Idempotency)** | Rejected | Detected: `already_submitted = true` | **PASS** |
| **Expired Deadline Rejection ($t > \text{deadline} + 500\text{ms}$)** | Rejected | Rejected: `"Deadline expired"` | **PASS** |
| **Deterministic Tie-Breaking Execution** | Deterministic | Rank computed across Total → R2 → Speed | **PASS** |

---

## 2. Functional & Security Test Suite Matrix

| Test Case | Description | Verification Method | Result |
|---|---|---|---|
| **TC-01: Name & School Validation** | Whitespace trimming, preventing empty entries | Unit validation test | PASS |
| **TC-02: Class Restriction** | Only 11th or 12th allowed | Database check constraint | PASS |
| **TC-03: Answer Key Protection** | Correct answers stripped from public question views | Code review & schema test | PASS |
| **TC-04: Authoritative Timer Sync** | Clock skew calculated, deadline enforced server-side | Timing benchmark | PASS |
| **TC-05: Auto-Progression** | Auto-advance triggers after 20.3s | Orchestration timer test | PASS |
| **TC-06: CSV Export** | Results exported with accurate score and time records | Integration test | PASS |
| **TC-07: Destructive Reset Confirmation** | Requires typing "RESET COMPETITION" | UI modal verification | PASS |
