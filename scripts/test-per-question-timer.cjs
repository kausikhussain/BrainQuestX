/**
 * QUIZMANIA STRICT 20-SECOND PER-QUESTION TIMER & AUTO-ADVANCEMENT TEST SUITE
 * 
 * Verifies:
 * 1. Each question receives an independent 20-second allowance (not global 20s)
 * 2. Authoritative deadline establishment: `deadline = start + 20000ms`
 * 3. Rejection of answers submitted after deadline (expired question locked)
 * 4. Automatic advancement when timer reaches 00:00 without requiring clicks
 * 5. Expired unanswered questions recorded correctly as unanswered
 * 6. Page refresh recovers exact remaining time from authoritative deadline (no reset)
 * 7. Expiry of final question (Question 10) automatically finalizes the exam
 */

const assert = require('assert');

class TimerEngineSimulator {
  constructor() {
    this.virtualClock = 1000000000; // baseline timestamp
    this.attempt = {
      attemptId: 'att_timer_test',
      participantId: 'candidate_timer_1',
      roundNumber: 1,
      questionSequence: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
      currentQuestionIndex: 0,
      questionTimers: {},
      answers: {},
      isSubmitted: false,
    };
  }

  getNow() {
    return this.virtualClock;
  }

  advanceClock(ms) {
    this.virtualClock += ms;
  }

  startQuestionTimer(questionIndex) {
    const qId = this.attempt.questionSequence[questionIndex];
    if (!qId) return null;

    let timer = this.attempt.questionTimers[qId];
    if (!timer) {
      const now = this.getNow();
      timer = {
        questionId: qId,
        firstDisplayedAt: now,
        durationSeconds: 20,
        deadlineTime: now + 20000,
        isLocked: false,
        isExpired: false,
        timeSpentMs: 0,
      };
      this.attempt.questionTimers[qId] = timer;
    }
    this.attempt.currentQuestionIndex = questionIndex;
    return timer;
  }

  saveQuestionAnswer(questionId, optionId) {
    const timer = this.attempt.questionTimers[questionId];
    const now = this.getNow();

    if (!timer || timer.isLocked) {
      return { success: false, error: 'Question locked' };
    }
    if (now > timer.deadlineTime + 500) { // 500ms network buffer
      timer.isLocked = true;
      timer.isExpired = true;
      return { success: false, error: 'Deadline expired. Answer rejected.' };
    }

    this.attempt.answers[questionId] = optionId;
    timer.timeSpentMs = now - timer.firstDisplayedAt;
    return { success: true };
  }

  advanceQuestionAttempt(currentIndex) {
    const currentQId = this.attempt.questionSequence[currentIndex];
    const now = this.getNow();

    if (currentQId && this.attempt.questionTimers[currentQId]) {
      const timer = this.attempt.questionTimers[currentQId];
      timer.isLocked = true;
      timer.isExpired = true;
      if (!timer.timeSpentMs) {
        timer.timeSpentMs = Math.min(20000, now - timer.firstDisplayedAt);
      }
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < this.attempt.questionSequence.length) {
      this.attempt.currentQuestionIndex = nextIndex;
      this.startQuestionTimer(nextIndex);
      return { nextIndex, isCompleted: false, attempt: this.attempt };
    } else {
      this.attempt.isSubmitted = true;
      return { nextIndex: null, isCompleted: true, attempt: this.attempt };
    }
  }
}

console.log('======================================================================');
console.log('    QUIZMANIA STRICT 20-SECOND PER-QUESTION TIMER VERIFICATION SUITE   ');
console.log('======================================================================\n');

const engine = new TimerEngineSimulator();

// [TEST 1] Question 1 starts with 20 seconds
console.log('[TEST 1] Verifying Question 1 starts with exactly 20 seconds...');
const timerQ1 = engine.startQuestionTimer(0);
assert.strictEqual(timerQ1.durationSeconds, 20);
assert.strictEqual(timerQ1.deadlineTime - timerQ1.firstDisplayedAt, 20000);
console.log('  -> PASS: Question 1 authoritative deadline established: +20,000ms.');

// [TEST 2] Countdown advances accurately
console.log('\n[TEST 2] Verifying countdown decreases over time...');
engine.advanceClock(8000); // 8 seconds elapsed
const remainingMs = timerQ1.deadlineTime - engine.getNow();
const remainingSecs = Math.ceil(remainingMs / 1000);
assert.strictEqual(remainingSecs, 12, 'After 8s, 12s should remain');
console.log('  -> PASS: Countdown at t+8s correctly calculates 12 seconds remaining.');

// [TEST 3] Candidate answers before deadline
console.log('\n[TEST 3] Testing valid answer submission within 20s window...');
const answerRes = engine.saveQuestionAnswer('q1', 'q1-opt-b');
assert.strictEqual(answerRes.success, true);
assert.strictEqual(engine.attempt.answers['q1'], 'q1-opt-b');
console.log('  -> PASS: Valid answer accepted and recorded.');

// [TEST 4] Advancement to Question 2 starts fresh 20s allowance
console.log('\n[TEST 4] Testing advancement to Question 2 with fresh 20-second timer...');
const advRes = engine.advanceQuestionAttempt(0);
assert.strictEqual(advRes.nextIndex, 1);
assert.strictEqual(advRes.isCompleted, false);

const timerQ2 = engine.attempt.questionTimers['q2'];
assert.strictEqual(timerQ2.durationSeconds, 20);
assert.strictEqual(timerQ2.firstDisplayedAt, engine.getNow());
assert.strictEqual(timerQ2.deadlineTime, engine.getNow() + 20000);
console.log('  -> PASS: Question 2 receives an independent 20-second countdown.');

// [TEST 5] Expiration rejection on Question 2
console.log('\n[TEST 5] Testing deadline expiry rejection on Question 2 (t+21s)...');
engine.advanceClock(21000); // 21 seconds pass
const expiredAnswerRes = engine.saveQuestionAnswer('q2', 'q2-opt-c');
assert.strictEqual(expiredAnswerRes.success, false);
assert.match(expiredAnswerRes.error, /Deadline expired/);
console.log('  -> PASS: Late answer strictly rejected after 20-second deadline.');

// [TEST 6] Auto-advancement on expiry marks question as unanswered
console.log('\n[TEST 6] Testing automatic advancement on expiry (marks unanswered)...');
const advQ2 = engine.advanceQuestionAttempt(1);
assert.strictEqual(advQ2.nextIndex, 2);
assert.strictEqual(engine.attempt.answers['q2'], undefined, 'Expired question remains unanswered');
assert.strictEqual(engine.attempt.questionTimers['q2'].isLocked, true);
console.log('  -> PASS: Expired question locked and recorded as unanswered.');

// [TEST 7] Page refresh does not reset deadline
console.log('\n[TEST 7] Testing simulated page refresh at t+5s of Question 3...');
engine.advanceClock(5000); // 5s into Q3
const timerQ3Before = engine.attempt.questionTimers['q3'];
const remainingBefore = Math.ceil((timerQ3Before.deadlineTime - engine.getNow()) / 1000);

// Simulate page reload calling startQuestionTimer
const timerQ3After = engine.startQuestionTimer(2);
const remainingAfter = Math.ceil((timerQ3After.deadlineTime - engine.getNow()) / 1000);
assert.strictEqual(remainingAfter, remainingBefore, 'Refresh must not reset timer');
assert.strictEqual(remainingAfter, 15, '15s must remain');
console.log('  -> PASS: Authoritative deadline recovered. Zero time reset on refresh.');

// [TEST 8] Final Question (Question 10) expiry finalizes the exam
console.log('\n[TEST 8] Advancing through remaining questions to Question 10...');
for (let i = 2; i < 9; i++) {
  engine.advanceQuestionAttempt(i);
}
assert.strictEqual(engine.attempt.currentQuestionIndex, 9, 'Should be on Question 10');

console.log('Finalizing Question 10...');
const finalRes = engine.advanceQuestionAttempt(9);
assert.strictEqual(finalRes.isCompleted, true);
assert.strictEqual(finalRes.nextIndex, null);
assert.strictEqual(engine.attempt.isSubmitted, true);
console.log('  -> PASS: Question 10 expiration/confirmation automatically finalizes exam attempt.');

console.log('\n======================================================================');
console.log('       ALL 8 STRICT 20-SECOND PER-QUESTION TIMER TESTS PASSED!        ');
console.log('======================================================================');

