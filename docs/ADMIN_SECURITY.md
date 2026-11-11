# STRICT ADMIN SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
**Document Version:** 2.1 (Two-Round Secure Edition)  
**Status:** Implemented & Verified  

---

## 1. Security Architecture Overview

Administrative access is restricted strictly to authorized tournament organizers and examination directors. 

The platform enforces **backend-level Role-Based Access Control**:
- **STUDENT:** Can only register, view briefing, agree to instructions, answer questions within authoritative deadlines, and inspect their own finalized score. Cannot modify state, inspect answer keys, or access organizer tooling.
- **ADMIN:** Authorized to monitor candidate telemetry, inspect question-by-question scoring audits with rationales, adjust qualification cutoffs, export official CSV score reports, and reset competition data.

---

## 2. Authentication Flow & Token Lifecycle

1. **Sign-In Interface:**
   - Dedicated Administrator Sign-In Gate at `/#admin`.
   - Requires Administrator Username (`admin` or `organizer`) and Password / Secret Key.
   - **Zero Development Credentials Exposed:** No placeholder credentials, hints, or pre-filled values visible in client UI.
2. **Cryptographic Session Generation:**
   - On successful verification, the backend generates an authoritative 64-character session token:
     $$\text{Token} = \text{agt\_} + \text{randomUUID}() + \text{timestamp}$$
   - Valid for 2 hours (`expiresAt = Date.now() + 7200000`).
   - Stored in browser `sessionStorage` (cleared automatically upon browser tab closure).
3. **Brute-Force & Rate Limiting Defense:**
   - Failed authentication attempts are tracked per account.
   - After 5 consecutive failed attempts, a mandatory **60-second security lockout** is triggered.
   - All subsequent login requests are blocked until the lockout window expires.

---

## 3. Server-Enforced Protected APIs

Every administrative function verifies the caller's session token:

```typescript
private requireAdmin(token?: string | null): void {
  if (!this.verifyAdminSession(token)) {
    throw new Error('UNAUTHORIZED: Valid administrator session token required. Access denied.');
  }
}
```

Protected operations:
- `setQualifyingScore(newCutoff, adminToken)`
- `resetCompetition(adminToken)`
- `getStudentAttemptAudit(participantId, roundNumber, adminToken)`
- `exportResultsCSV(adminToken)`
- `getAdminAuditLogs(adminToken)`
- `setStatus(newStatus, adminToken)`

---

## 4. Administrative Audit Logging

All administrative actions are appended to an immutable in-memory audit log:
- `ADMIN_LOGIN_SUCCESS` (with timestamp and token prefix)
- `ADMIN_LOGIN_FAILED` (with reason and attempt count)
- `UPDATE_QUALIFYING_CUTOFF` (with old and new cutoff thresholds)
- `RESET_COMPETITION`
- `EXPORT_RESULTS_CSV` (with candidate row count)
- `ADMIN_LOGOUT`

---

## 5. Automated Verification Results

Covered by `scripts/test-admin-security.cjs`:
- [x] Unauthenticated visitor access rejected (`UNAUTHORIZED`).
- [x] Forged / invalid tokens rejected.
- [x] Invalid admin credentials rejected.
- [x] 5-failure brute force lockout triggered.
- [x] Authorized token generation verified (`agt_...`).
- [x] Expired tokens rejected.
- [x] Token revocation on logout verified.

