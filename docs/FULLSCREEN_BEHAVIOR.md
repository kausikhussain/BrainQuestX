# AUTOMATIC FULL-SCREEN EXAMINATION MODE & TELEMETRY SPECIFICATION
**Document Version:** 2.1 (Two-Round Secure Edition)  
**Status:** Implemented & Verified  

---

## 1. Operational Rationale

To maintain academic focus and discourage distractions during competitive online quizzes, QuizMania requires candidates to take their assessments in **Full-Screen Mode**.

Full-screen mode is implemented as an examination-discipline measure with honest browser compatibility handling, not as an invasive spyware harness.

---

## 2. Launch & Gesture Activation

Modern web standards (W3C Fullscreen API) strictly forbid browsers from entering full-screen mode programmatically without an explicit user gesture.

### Workflow:
1. **Instructions Gate:** The student reads the guidelines informing them that the examination requires full-screen mode.
2. **"Start Examination (Full Screen)" Action:** The student clicks the primary CTA, which triggers:
   ```typescript
   if (document.documentElement.requestFullscreen) {
     await document.documentElement.requestFullscreen();
   }
   ```
3. **Workspace Entry:** The examination initializes, and Question 1's 20-second timer begins immediately.

---

## 3. Full-Screen Exit Detection & Warning Overlay

The platform listens for `fullscreenchange` and `webkitfullscreenchange` events continuously.

### When an Exit Occurs:
1. **Warning Overlay:** An immediate modal overlay appears with an alert:
   > *"Full-Screen Mode Exited. Examination regulations require full-screen mode to remain active. This exit event has been recorded in candidate audit telemetry with timestamps."*
2. **Action Provided:** A prominent button **"Return to Full Screen"** allows the student to re-enter with a single click.
3. **Timer Continuity:** The authoritative 20-second question timer **continues counting down** in the background. Exiting full-screen **never pauses or resets the timer**.
4. **No Unfair Automatic Disqualification:** To protect students from accidental OS notifications, trackpad gestures, or system dialogs, exit events do **not** trigger automatic disqualification. Instead, all events are logged for administrative audit.

---

## 4. Telemetry Storage & Organizer Inspection

Every full-screen exit records:
- Total exit count (`attempt.fullscreenExitCount`)
- Exact exit timestamp (`timestamp: Date.now()`)
- Return timestamp (`returnedAt: Date.now()`)

### Administrative Visibility:
- **Candidate Roster Table:** Features a dedicated **Fullscreen Exits** column (`0 Exits` green badge, or `N Exits` amber badge).
- **Student Audit Modal:** Displays the total exit count and an itemized timeline log of every exit event.

---

## 5. Automated Verification Results

Covered by `scripts/test-fullscreen-telemetry.cjs`:
- Initial state verified at 0 exits.
- Exit event increments counter and appends timestamp.
- Re-entry records `returnedAt` timestamp.
- Candidate answers and attempt state preserved intact.
- Zero unfair automatic disqualification verified.

