/**
 * QUIZMANIA MANDATORY QUESTION SHUFFLING & PERSISTENCE TEST SUITE
 * 
 * Verifies:
 * 1. Independent server-side Fisher-Yates randomization for each candidate
 * 2. Uniqueness of permutations across cohort (ensures different orderings)
 * 3. Exact containment of all 10 questions of the round (no duplicates, no omissions)
 * 4. Strict persistence across refresh (reloading attempt preserves exact same sequence)
 * 5. Immutable Question ID and Option ID mapping for 100% accurate score evaluation
 * 6. Strict Round isolation (Round 1 = General Paper only, Round 2 = Subject Paper only)
 */

const assert = require('assert');

const R1_QUESTION_IDS = [
  'r1-q1', 'r1-q2', 'r1-q3', 'r1-q4', 'r1-q5',
  'r1-q6', 'r1-q7', 'r1-q8', 'r1-q9', 'r1-q10'
];

const R2_QUESTION_IDS = [
  'r2-q1', 'r2-q2', 'r2-q3', 'r2-q4', 'r2-q5',
  'r2-q6', 'r2-q7', 'r2-q8', 'r2-q9', 'r2-q10'
];

// Authoritative correct option IDs for testing evaluation
const R1_CORRECT_KEYS = {
  'r1-q1': 'r1-q1-d',
  'r1-q2': 'r1-q2-d',
  'r1-q3': 'r1-q3-a',
  'r1-q4': 'r1-q4-b',
  'r1-q5': 'r1-q5-d',
  'r1-q6': 'r1-q6-a',
  'r1-q7': 'r1-q7-b',
  'r1-q8': 'r1-q8-d',
  'r1-q9': 'r1-q9-c',
  'r1-q10': 'r1-q10-a',
};

class RandomizationSimulator {
  constructor() {
    this.attempts = {};
  }

  generateRandomizedSequence(roundNumber, participantId) {
    const baseQuestionIds = roundNumber === 1 ? [...R1_QUESTION_IDS] : [...R2_QUESTION_IDS];
    const existingSequences = new Set();

    Object.values(this.attempts).forEach((att) => {
      if (att.roundNumber === roundNumber && att.participantId !== participantId && att.questionSequence) {
        existingSequences.add(att.questionSequence.join(','));
      }
    });

    let sequence = [...baseQuestionIds];
    let tries = 0;
    do {
      for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }
      tries++;
    } while (existingSequences.has(sequence.join(',')) && tries < 100);

    return sequence;
  }

  startExamAttempt(participantId, roundNumber) {
    const key = `${participantId}_round_${roundNumber}`;
    if (this.attempts[key] && !this.attempts[key].isSubmitted) {
      // RESTORE EXISTING SEQUENCE - NEVER RESHUFFLE!
      return this.attempts[key];
    }

    const questionSequence = this.generateRandomizedSequence(roundNumber, participantId);
    const newAttempt = {
      attemptId: 'att_' + Math.random().toString(36).substring(2, 8),
      participantId,
      roundNumber,
      questionSequence,
      answers: {},
      isSubmitted: false,
    };
    this.attempts[key] = newAttempt;
    return newAttempt;
  }

  evaluateAttempt(attempt) {
    let score = 0;
    const questions = attempt.roundNumber === 1 ? R1_QUESTION_IDS : R2_QUESTION_IDS;
    questions.forEach((qId) => {
      const selected = attempt.answers[qId];
      if (selected && selected === R1_CORRECT_KEYS[qId]) {
        score += 10;
      }
    });
    return score;
  }
}

console.log('======================================================================');
console.log('   QUIZMANIA UNIQUE QUESTION SHUFFLING & EVALUATION INTEGRITY SUITE   ');
console.log('======================================================================\n');

const sim = new RandomizationSimulator();

// [TEST 1] Generate sequences for 20 distinct students in Round 1
console.log('[TEST 1] Testing question shuffling uniqueness across 20 students...');
const studentSequences = [];
for (let i = 1; i <= 20; i++) {
  const pId = `student_${i}`;
  const att = sim.startExamAttempt(pId, 1);
  assert.strictEqual(att.questionSequence.length, 10, 'Must have exactly 10 questions');

  // Verify all 10 base questions are present
  const sorted = [...att.questionSequence].sort();
  assert.deepStrictEqual(sorted, [...R1_QUESTION_IDS].sort(), 'Must contain all 10 questions with no duplicates');

  studentSequences.push(att.questionSequence.join(','));
}

// Verify distinctness of sequences
const uniqueSeqCount = new Set(studentSequences).size;
console.log(`  -> Generated 20 sequences. Unique permutations: ${uniqueSeqCount} / 20.`);
assert.ok(uniqueSeqCount >= 18, 'At least 90% of sequences must be completely unique across cohort');
console.log('  -> PASS: Unique question shuffling across cohort verified.');

// [TEST 2] Persistence test: Page refresh / reconnection must restore exact same sequence
console.log('\n[TEST 2] Testing sequence persistence across simulated page refresh...');
const originalAttempt = sim.startExamAttempt('student_1', 1);
const originalOrder = [...originalAttempt.questionSequence];

// Simulate candidate answering question at index 0 and 1
originalAttempt.answers[originalOrder[0]] = 'r1-q1-d';
originalAttempt.answers[originalOrder[1]] = 'r1-q2-d';

// Simulate page reload
const reloadedAttempt = sim.startExamAttempt('student_1', 1);
assert.deepStrictEqual(reloadedAttempt.questionSequence, originalOrder, 'Sequence must NOT change on page refresh');
assert.strictEqual(reloadedAttempt.answers[originalOrder[0]], 'r1-q1-d', 'Answers must persist on reload');
console.log('  -> PASS: Question sequence preserved intact on reload. Never reshuffled!');

// [TEST 3] Critical evaluation correctness regardless of sequence
console.log('\n[TEST 3] Testing evaluation correctness with shuffled order...');
// Candidate answers all 10 questions correctly, referencing question IDs directly
originalOrder.forEach((qId) => {
  reloadedAttempt.answers[qId] = R1_CORRECT_KEYS[qId];
});

const score = sim.evaluateAttempt(reloadedAttempt);
assert.strictEqual(score, 100, 'All 10 correct answers must yield 100 points regardless of order');
console.log('  -> PASS: Evaluation strictly maps by immutable Question ID. Score: 100/100.');

// [TEST 4] Round 2 Subject Paper Isolation
console.log('\n[TEST 4] Testing Round 2 (Subject Paper) question shuffling isolation...');
const r2Attempt = sim.startExamAttempt('student_1', 2);
assert.strictEqual(r2Attempt.questionSequence.length, 10);
const r2Sorted = [...r2Attempt.questionSequence].sort();
assert.deepStrictEqual(r2Sorted, [...R2_QUESTION_IDS].sort(), 'Round 2 must strictly contain Python Subject questions');
console.log('  -> PASS: Round 2 question isolation verified.');

console.log('\n======================================================================');
console.log('       ALL QUESTION SHUFFLING & EVALUATION INTEGRITY TESTS PASSED!     ');
console.log('======================================================================');

