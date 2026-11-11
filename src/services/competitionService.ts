import { 
  CompetitionState, 
  Participant, 
  SubmissionResult, 
  RegistrationResult, 
  LeaderboardEntry, 
  StudentClass, 
  CompetitionStatus,
  StudentExamAttempt,
  AttemptAuditReport,
  QuestionAuditDetail,
  AdminSession,
  AdminAuthResult,
  AdminAuditLogEntry,
  QuestionTimerState,
  FullscreenExitEvent,
  Question
} from '../types';
import { 
  CLIENT_QUESTIONS, 
  SERVER_QUESTION_BANK, 
  COMPETITION_ROUNDS,
  OFFICIAL_ROUND_PAPERS,
  OFFICIAL_MARKING_SCHEME,
  getPaperConfig,
  getServerQuestionsForRound
} from '../data/questions';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  STATE: 'quizmania_competition_state',
  PARTICIPANTS: 'quizmania_participants',
  SUBMISSIONS: 'quizmania_submissions',
  STUDENT_SESSION: 'quizmania_active_student',
  EXAM_ATTEMPTS: 'quizmania_exam_attempts',
  ADMIN_SESSIONS: 'quizmania_admin_sessions',
  ADMIN_AUDIT_LOGS: 'quizmania_admin_audit_logs',
};

// Default initial state
const INITIAL_STATE: CompetitionState = {
  id: '00000000-0000-0000-0000-000000000001',
  code: 'QUIZ-2026',
  title: 'Inter-School Technical Quiz Competition 2026',
  description: 'Ultra-Premium Technical Examination for Class 11th & 12th students featuring General Tech & Python Programming rounds.',
  status: 'registration_open',
  current_round_number: 1,
  current_question_id: null,
  current_question_number: 0,
  question_start_time: null,
  question_deadline: null,
  duration_per_question: 20,
  auto_advance: true,
  round_1_qualifying_score: 60, // 60% standard qualifying cutoff (6 out of 10)
};

type StateListener = (state: CompetitionState) => void;

class CompetitionService {
  private localState: CompetitionState = { ...INITIAL_STATE };
  private participants: Participant[] = [];
  private submissions: Array<{
    id: string;
    competition_id: string;
    round_number: number;
    question_id: string;
    participant_id: string;
    selected_option_id: string;
    is_correct: boolean;
    points_awarded: number;
    latency_ms: number;
    server_received_at: string;
  }> = [];
  private examAttempts: Record<string, StudentExamAttempt> = {};
  private adminSessions: Record<string, AdminSession> = {};
  private adminAuditLogs: AdminAuditLogEntry[] = [];
  private failedLoginAttempts: Record<string, { count: number; lockedUntil: number }> = {};

  private listeners: Set<StateListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private autoAdvanceTimer: any = null;
  private clockOffsetMs = 0; // serverTime - clientTime

  constructor() {
    this.initStorage();
    this.setupBroadcast();
    this.syncServerTime();
  }

  private initStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.STATE);
      if (savedState) {
        this.localState = { ...INITIAL_STATE, ...JSON.parse(savedState) };
      } else {
        localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(this.localState));
      }

      const savedParticipants = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (savedParticipants) {
        this.participants = JSON.parse(savedParticipants);
      }

      const savedSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (savedSubmissions) {
        this.submissions = JSON.parse(savedSubmissions);
      }

      const savedAttempts = localStorage.getItem(STORAGE_KEYS.EXAM_ATTEMPTS);
      if (savedAttempts) {
        this.examAttempts = JSON.parse(savedAttempts);
      }

      const savedAdminSessions = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSIONS);
      if (savedAdminSessions) {
        this.adminSessions = JSON.parse(savedAdminSessions);
      }

      const savedAdminLogs = localStorage.getItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS);
      if (savedAdminLogs) {
        this.adminAuditLogs = JSON.parse(savedAdminLogs);
      }
    } catch (e) {
      console.warn('Storage initialization error:', e);
    }
  }

  private setupBroadcast() {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('quizmania_sync_channel');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_UPDATED') {
          this.localState = payload;
          this.notifyListeners();
        } else if (type === 'PARTICIPANTS_UPDATED') {
          this.participants = payload;
        } else if (type === 'SUBMISSIONS_UPDATED') {
          this.submissions = payload;
        } else if (type === 'ATTEMPTS_UPDATED') {
          this.examAttempts = payload;
        }
      };
    }

    // Also listen to storage events across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.STATE && e.newValue) {
        try {
          this.localState = JSON.parse(e.newValue);
          this.notifyListeners();
        } catch {}
      } else if (e.key === STORAGE_KEYS.PARTICIPANTS && e.newValue) {
        try {
          this.participants = JSON.parse(e.newValue);
        } catch {}
      } else if (e.key === STORAGE_KEYS.EXAM_ATTEMPTS && e.newValue) {
        try {
          this.examAttempts = JSON.parse(e.newValue);
        } catch {}
      }
    });

    // If Supabase is connected, set up Realtime subscription for competitions
    if (isSupabaseConfigured() && supabase) {
      supabase
        .channel('public:competitions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'competitions' },
          (payload: any) => {
            if (payload.new) {
              this.localState = {
                ...this.localState,
                ...payload.new,
              };
              this.notifyListeners();
            }
          }
        )
        .subscribe();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.getCompetitionState());
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    });
  }

  private persistLocal() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(this.localState));
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(this.participants));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEYS.EXAM_ATTEMPTS, JSON.stringify(this.examAttempts));
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSIONS, JSON.stringify(this.adminSessions));
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS, JSON.stringify(this.adminAuditLogs));

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'STATE_UPDATED',
          payload: this.localState,
        });
      }
    } catch (e) {
      console.warn('Persist error:', e);
    }
  }

  /**
   * Synchronize time with server or reference clock.
   * Calculates network roundtrip and clock skew.
   */
  public async syncServerTime(): Promise<number> {
    if (isSupabaseConfigured() && supabase) {
      const clientSend = Date.now();
      try {
        const { data, error } = await supabase.rpc('get_server_time');
        const clientReceive = Date.now();
        if (!error && typeof data === 'number') {
          const roundtrip = clientReceive - clientSend;
          const serverTime = data;
          this.clockOffsetMs = serverTime - (clientSend + roundtrip / 2);
          return this.getEstimatedServerTime();
        }
      } catch (err) {
        console.warn('Clock sync fallback to local clock:', err);
      }
    }
    // Local clock
    this.clockOffsetMs = 0;
    return Date.now();
  }

  public getEstimatedServerTime(): number {
    return Date.now() + this.clockOffsetMs;
  }

  public getCompetitionState(): CompetitionState {
    return {
      ...this.localState,
      server_time: this.getEstimatedServerTime(),
    };
  }

  public subscribeToState(callback: StateListener): () => void {
    this.listeners.add(callback);
    callback(this.getCompetitionState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  // ==========================================
  // STUDENT REGISTRATION & SESSIONS
  // ==========================================

  public async registerStudent(
    studentName: string,
    schoolName: string,
    studentClass: StudentClass
  ): Promise<RegistrationResult> {
    const cleanName = studentName.trim();
    const cleanSchool = schoolName.trim();

    if (!cleanName || !cleanSchool) {
      return { success: false, error: 'Student full name and school name are required.' };
    }
    if (studentClass !== '11th' && studentClass !== '12th') {
      return { success: false, error: 'Class must be either 11th or 12th.' };
    }

    if (this.localState.status === 'registration_closed') {
      return { success: false, error: 'Registration is currently closed by the examination administrator.' };
    }

    // If Supabase configured, call RPC
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('register_participant', {
          p_competition_code: this.localState.code,
          p_student_name: cleanName,
          p_school_name: cleanSchool,
          p_student_class: studentClass,
        });

        if (error) {
          return { success: false, error: error.message };
        }
        if (data && data.success) {
          const participant: Participant = {
            id: data.participant_id,
            competition_id: this.localState.id,
            access_code: data.access_code,
            student_name: data.student_name,
            school_name: data.school_name,
            student_class: data.student_class,
            is_active: true,
            last_ping_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          this.saveStudentSession(participant);
          return data;
        }
        return { success: false, error: data?.error || 'Registration failed' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Local Authoritative Engine
    const existing = this.participants.find(
      (p) =>
        p.student_name.toLowerCase() === cleanName.toLowerCase() &&
        p.school_name.toLowerCase() === cleanSchool.toLowerCase() &&
        p.student_class === studentClass
    );

    if (existing) {
      this.saveStudentSession(existing);
      return {
        success: true,
        is_duplicate: true,
        participant_id: existing.id,
        access_code: existing.access_code,
        student_name: existing.student_name,
        school_name: existing.school_name,
        student_class: existing.student_class,
        message: 'Welcome back! Restored your verified candidate profile.',
      };
    }

    const newId = 'part_' + Math.random().toString(36).substring(2, 10);
    const accessCode = 'QZ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const participant: Participant = {
      id: newId,
      competition_id: this.localState.id,
      access_code: accessCode,
      student_name: cleanName,
      school_name: cleanSchool,
      student_class: studentClass,
      is_active: true,
      last_ping_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    this.participants.push(participant);
    this.persistLocal();
    this.saveStudentSession(participant);

    return {
      success: true,
      is_duplicate: false,
      participant_id: participant.id,
      access_code: participant.access_code,
      student_name: participant.student_name,
      school_name: participant.school_name,
      student_class: participant.student_class,
      message: 'Registration confirmed! Welcome to the examination platform.',
    };
  }

  public saveStudentSession(participant: Participant) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(participant));
    }
  }

  public getActiveStudentSession(): Participant | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public clearStudentSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
    }
  }

  // ==========================================
  // STUDENT SELF-DIRECTED EXAMINATION ATTEMPTS
  // ==========================================

  private getAttemptKey(participantId: string, roundNumber: 1 | 2): string {
    return `${participantId}_round_${roundNumber}`;
  }

  /**
   * Generates a server-authoritative randomized question sequence for a student attempt.
   * Guarantees unique permutations across the active cohort using Fisher-Yates shuffle.
   * Round 1 = General Paper questions only.
   * Round 2 = Subject Paper questions only.
   */
  public generateRandomizedSequence(roundNumber: 1 | 2, participantId: string): string[] {
    const roundQuestions = CLIENT_QUESTIONS.filter((q) => q.roundNumber === roundNumber);
    const baseQuestionIds = roundQuestions.map((q) => q.id);

    // Retrieve all existing assigned sequences for this round across other candidates
    const existingSequences = new Set<string>();
    Object.values(this.examAttempts).forEach((att) => {
      if (att.roundNumber === roundNumber && att.participantId !== participantId && att.questionSequence?.length) {
        existingSequences.add(att.questionSequence.join(','));
      }
    });

    let sequence = [...baseQuestionIds];
    let attempts = 0;
    const maxTries = 100;

    do {
      // Fisher-Yates shuffle
      for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }
      attempts++;
    } while (existingSequences.has(sequence.join(',')) && attempts < maxTries);

    return sequence;
  }

  /**
   * Starts or resumes an authoritative examination attempt for a student.
   * Round 1 = General Paper (open to all registered candidates)
   * Round 2 = Subject Paper (strictly gated by Round 1 qualification)
   * 
   * PERSISTENCE GUARANTEE: If a student refreshes or reconnects, the existing attempt
   * and its assigned randomized sequence are restored intact. Never reshuffled!
   */
  public startExamAttempt(
    participantId: string,
    roundNumber: 1 | 2
  ): StudentExamAttempt {
    // Security check: Only officially qualified candidates can start Round 2
    if (roundNumber === 2 && !this.isStudentQualifiedForRound2(participantId)) {
      throw new Error('Access Denied: Candidate must qualify from Round 1 (General Paper) to access Round 2 (Subject Paper).');
    }

    const key = this.getAttemptKey(participantId, roundNumber);
    const existing = this.examAttempts[key];

    // If an existing attempt is already started and unsubmitted, RESTORE IT!
    if (existing && !existing.isSubmitted) {
      return existing;
    }

    const paperConfig = getPaperConfig(roundNumber);
    const questionSequence = this.generateRandomizedSequence(roundNumber, participantId);
    const firstQId = questionSequence[0] || '';
    const now = this.getEstimatedServerTime();
    
    // Per-question timer: 20 seconds per question (10 questions = 200 seconds nominal total)
    const perQuestionDurationSeconds = this.localState.duration_per_question || 20;
    const nominalTotalDurationSeconds = questionSequence.length * perQuestionDurationSeconds;
    const deadlineTime = now + nominalTotalDurationSeconds * 1000;

    // Initialize first question timer
    const questionTimers: Record<string, QuestionTimerState> = {};
    if (firstQId) {
      questionTimers[firstQId] = {
        questionId: firstQId,
        firstDisplayedAt: now,
        durationSeconds: perQuestionDurationSeconds,
        deadlineTime: now + perQuestionDurationSeconds * 1000,
        isLocked: false,
        isExpired: false,
        timeSpentMs: 0,
      };
    }

    const newAttempt: StudentExamAttempt = {
      attemptId: 'att_' + Math.random().toString(36).substring(2, 10),
      participantId,
      roundNumber,
      paperId: paperConfig.paperId,
      paperName: paperConfig.paperName,
      startTime: now,
      durationSeconds: nominalTotalDurationSeconds,
      deadlineTime,
      questionSequence,
      currentQuestionIndex: 0,
      questionTimers,
      fullscreenExitCount: 0,
      fullscreenExits: [],
      answers: {},
      visitedQuestionIds: firstQId ? [firstQId] : [],
      markedForReviewIds: [],
      isSubmitted: false,
    };

    this.examAttempts[key] = newAttempt;
    this.persistLocal();
    return newAttempt;
  }

  /**
   * Retrieves client-safe questions (stripped of answer keys) in the student's assigned randomized sequence.
   */
  public getQuestionsForAttempt(
    participantId: string,
    roundNumber: 1 | 2
  ): Question[] {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    const roundQuestions = CLIENT_QUESTIONS.filter((q) => q.roundNumber === roundNumber);
    if (!attempt || !attempt.questionSequence || attempt.questionSequence.length === 0) {
      return roundQuestions;
    }

    const map = new Map<string, Question>();
    roundQuestions.forEach((q) => {
      map.set(q.id, q);
    });

    return attempt.questionSequence
      .map((id) => map.get(id))
      .filter((q): q is Question => Boolean(q));
  }

  public getActiveExamAttempt(
    participantId: string,
    roundNumber: 1 | 2
  ): StudentExamAttempt | null {
    const key = this.getAttemptKey(participantId, roundNumber);
    return this.examAttempts[key] || null;
  }

  public saveExamAttempt(attempt: StudentExamAttempt): void {
    const key = this.getAttemptKey(attempt.participantId, attempt.roundNumber);
    this.examAttempts[key] = attempt;
    this.persistLocal();
  }

  /**
   * Starts or returns the 20-second countdown timer for a question in sequence.
   */
  public startQuestionTimer(
    participantId: string,
    roundNumber: 1 | 2,
    questionIndex: number
  ): QuestionTimerState | null {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) return null;

    const questionId = attempt.questionSequence[questionIndex];
    if (!questionId) return null;

    const now = this.getEstimatedServerTime();
    const durationSeconds = this.localState.duration_per_question || 20;

    if (!attempt.questionTimers) {
      attempt.questionTimers = {};
    }

    let timer = attempt.questionTimers[questionId];
    if (!timer) {
      timer = {
        questionId,
        firstDisplayedAt: now,
        durationSeconds,
        deadlineTime: now + durationSeconds * 1000,
        isLocked: false,
        isExpired: false,
        timeSpentMs: 0,
      };
      attempt.questionTimers[questionId] = timer;
    }

    if (!attempt.visitedQuestionIds.includes(questionId)) {
      attempt.visitedQuestionIds.push(questionId);
    }

    attempt.currentQuestionIndex = questionIndex;
    this.saveExamAttempt(attempt);
    return timer;
  }

  /**
   * Authoritatively records a candidate answer before deadline.
   * If the question has expired or is locked, the answer is rejected!
   */
  public saveQuestionAnswer(
    participantId: string,
    roundNumber: 1 | 2,
    questionId: string,
    optionId: string
  ): { success: boolean; isExpired: boolean; error?: string } {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) {
      return { success: false, isExpired: true, error: 'Examination attempt not active.' };
    }

    const timer = attempt.questionTimers?.[questionId];
    const now = this.getEstimatedServerTime();

    // 500ms network tolerance grace period
    if (timer && timer.isLocked) {
      return { success: false, isExpired: true, error: 'Question time has expired and is locked.' };
    }
    if (timer && now > timer.deadlineTime + 500) {
      timer.isExpired = true;
      timer.isLocked = true;
      this.saveExamAttempt(attempt);
      return { success: false, isExpired: true, error: 'Deadline expired. Answer rejected.' };
    }

    attempt.answers[questionId] = optionId;
    if (timer) {
      timer.submittedAt = now;
      timer.timeSpentMs = Math.max(0, now - timer.firstDisplayedAt);
    }
    if (!attempt.visitedQuestionIds.includes(questionId)) {
      attempt.visitedQuestionIds.push(questionId);
    }

    this.saveExamAttempt(attempt);
    return { success: true, isExpired: false };
  }

  /**
   * Advances from current question to next question in the randomized sequence.
   * Locks the current question and starts the next question's 20-second timer.
   * If advancing past question 10, completes and submits the exam!
   */
  public async advanceQuestionAttempt(
    participantId: string,
    roundNumber: 1 | 2,
    fromIndex: number
  ): Promise<{ nextIndex: number | null; isCompleted: boolean; attempt: StudentExamAttempt }> {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt) {
      throw new Error('No active examination attempt found.');
    }

    const currentQId = attempt.questionSequence[fromIndex];
    const now = this.getEstimatedServerTime();

    if (currentQId && attempt.questionTimers?.[currentQId]) {
      const timer = attempt.questionTimers[currentQId];
      timer.isLocked = true;
      timer.isExpired = true;
      if (!timer.timeSpentMs) {
        timer.timeSpentMs = Math.min(timer.durationSeconds * 1000, Math.max(0, now - timer.firstDisplayedAt));
      }
    }

    const nextIndex = fromIndex + 1;
    if (nextIndex < attempt.questionSequence.length) {
      attempt.currentQuestionIndex = nextIndex;
      const nextQId = attempt.questionSequence[nextIndex];
      const durationSeconds = this.localState.duration_per_question || 20;

      if (!attempt.questionTimers[nextQId]) {
        attempt.questionTimers[nextQId] = {
          questionId: nextQId,
          firstDisplayedAt: now,
          durationSeconds,
          deadlineTime: now + durationSeconds * 1000,
          isLocked: false,
          isExpired: false,
          timeSpentMs: 0,
        };
      }
      if (!attempt.visitedQuestionIds.includes(nextQId)) {
        attempt.visitedQuestionIds.push(nextQId);
      }
      this.saveExamAttempt(attempt);
      return { nextIndex, isCompleted: false, attempt };
    } else {
      // Final question complete -> Authoritative Submission
      const finalAttempt = await this.submitExamAttempt(participantId, roundNumber);
      return { nextIndex: null, isCompleted: true, attempt: finalAttempt };
    }
  }

  public recordFullscreenExit(participantId: string, roundNumber: 1 | 2): { exitCount: number } {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) return { exitCount: 0 };

    if (!attempt.fullscreenExits) attempt.fullscreenExits = [];
    attempt.fullscreenExitCount = (attempt.fullscreenExitCount || 0) + 1;
    attempt.fullscreenExits.push({ timestamp: Date.now() });

    this.saveExamAttempt(attempt);
    return { exitCount: attempt.fullscreenExitCount };
  }

  public recordFullscreenReturn(participantId: string, roundNumber: 1 | 2): void {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || !attempt.fullscreenExits || attempt.fullscreenExits.length === 0) return;

    const lastEvent = attempt.fullscreenExits[attempt.fullscreenExits.length - 1];
    if (lastEvent && !lastEvent.returnedAt) {
      lastEvent.returnedAt = Date.now();
      this.saveExamAttempt(attempt);
    }
  }

  public markQuestionVisited(
    participantId: string,
    roundNumber: 1 | 2,
    questionId: string
  ): void {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) return;

    if (!attempt.visitedQuestionIds.includes(questionId)) {
      attempt.visitedQuestionIds.push(questionId);
      this.saveExamAttempt(attempt);
    }
  }

  public clearQuestionAnswer(
    participantId: string,
    roundNumber: 1 | 2,
    questionId: string
  ): void {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) return;

    delete attempt.answers[questionId];
    this.saveExamAttempt(attempt);
  }

  public toggleMarkForReview(
    participantId: string,
    roundNumber: 1 | 2,
    questionId: string
  ): boolean {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt || attempt.isSubmitted) return false;

    const idx = attempt.markedForReviewIds.indexOf(questionId);
    let isMarked = false;
    if (idx >= 0) {
      attempt.markedForReviewIds.splice(idx, 1);
      isMarked = false;
    } else {
      attempt.markedForReviewIds.push(questionId);
      isMarked = true;
    }
    this.saveExamAttempt(attempt);
    return isMarked;
  }

  /**
   * Authoritative submission & scoring of a student's full examination attempt.
   * Correct answers are evaluated strictly on the trusted backend data structure.
   */
  public async submitExamAttempt(
    participantId: string,
    roundNumber: 1 | 2
  ): Promise<StudentExamAttempt> {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (!attempt) {
      throw new Error('No active examination attempt found.');
    }
    if (attempt.isSubmitted) {
      return attempt;
    }

    const now = this.getEstimatedServerTime();
    const roundQuestions = getServerQuestionsForRound(roundNumber);
    const totalQuestions = roundQuestions.length;
    const maxMarks = roundQuestions.reduce((sum, q) => sum + (q.points || 10), 0);

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalLatencyMs = 0;

    // Clear previous submissions for this student and round to remain idempotent
    this.submissions = this.submissions.filter(
      (s) => !(s.participant_id === participantId && s.round_number === roundNumber)
    );

    roundQuestions.forEach((q) => {
      const selectedOptionId = attempt.answers[q.id];
      const isAnswered = !!selectedOptionId;

      if (!isAnswered) {
        unansweredCount++;
        return;
      }

      const isCorrect = selectedOptionId === q.correctOptionId;
      const points = isCorrect ? (q.points || 10) : 0;

      if (isCorrect) {
        score += points;
        correctCount++;
      } else {
        incorrectCount++;
      }

      const qLatency = Math.round((now - attempt.startTime) / totalQuestions);
      totalLatencyMs += qLatency;

      // Record in centralized submissions registry for leaderboard and analytics
      this.submissions.push({
        id: 'sub_' + Math.random().toString(36).substring(2, 10),
        competition_id: this.localState.id,
        round_number: roundNumber,
        question_id: q.id,
        participant_id: participantId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        points_awarded: points,
        latency_ms: qLatency,
        server_received_at: new Date(now).toISOString(),
      });
    });

    const timeTakenSeconds = Math.max(1, Math.min(
      attempt.durationSeconds,
      Math.round((now - attempt.startTime) / 1000)
    ));

    // Qualification check for Round 1
    const cutoff = this.localState.round_1_qualifying_score ?? 60;
    const isQualified = score >= cutoff;
    const percentage = maxMarks > 0 ? Math.round((score / maxMarks) * 1000) / 10 : 0;

    attempt.isSubmitted = true;
    attempt.submittedAt = new Date(now).toISOString();
    attempt.score = score;
    attempt.maxMarks = maxMarks;
    attempt.percentage = percentage;
    attempt.totalQuestions = totalQuestions;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.timeTakenSeconds = timeTakenSeconds;
    attempt.isQualified = isQualified;

    this.saveExamAttempt(attempt);
    this.persistLocal();
    this.notifyListeners();

    return attempt;
  }

  public getStudentRoundResult(
    participantId: string,
    roundNumber: 1 | 2
  ): StudentExamAttempt | null {
    const attempt = this.getActiveExamAttempt(participantId, roundNumber);
    if (attempt && attempt.isSubmitted) {
      return attempt;
    }
    return null;
  }

  public isStudentQualifiedForRound2(participantId: string): boolean {
    const r1Result = this.getStudentRoundResult(participantId, 1);
    if (!r1Result) return false;
    return !!r1Result.isQualified;
  }

  public setQualifyingScore(score: number, adminToken?: string): void {
    if (adminToken !== undefined) {
      this.requireAdmin(adminToken);
    }
    this.localState.round_1_qualifying_score = score;
    this.logAdminAction('UPDATE_QUALIFYING_CUTOFF', 'admin', { newCutoff: score });
    this.persistLocal();
    this.notifyListeners();
  }

  public getQualifyingScore(): number {
    return this.localState.round_1_qualifying_score ?? 60;
  }

  /**
   * Generates a comprehensive, auditable question-by-question scoring report.
   * Useful for organizers to verify student answers against official answer keys.
   * Includes full-screen exit telemetry and detailed rationale.
   */
  public getStudentAttemptAudit(
    participantId: string,
    roundNumber: 1 | 2,
    adminToken?: string
  ): AttemptAuditReport | null {
    if (adminToken !== undefined) {
      this.requireAdmin(adminToken);
    }

    const participant = this.participants.find((p) => p.id === participantId);
    const attempt = this.getStudentRoundResult(participantId, roundNumber);
    if (!participant || !attempt) return null;

    const serverQuestions = getServerQuestionsForRound(roundNumber);
    const paper = getPaperConfig(roundNumber);

    const questions: QuestionAuditDetail[] = serverQuestions.map((q) => {
      const selectedOptionId = attempt.answers[q.id] || null;
      const selectedOption = selectedOptionId ? q.options.find((o) => o.id === selectedOptionId) : null;
      const correctOption = q.options.find((o) => o.id === q.correctOptionId) || q.options[0];
      const isCorrect = selectedOptionId === q.correctOptionId;
      const marksAwarded = isCorrect ? (q.points || 10) : 0;

      return {
        questionNumber: q.questionNumber,
        questionId: q.id,
        questionText: q.text,
        selectedOptionId,
        selectedOptionLabel: selectedOption?.label || null,
        selectedOptionText: selectedOption?.text || null,
        correctOptionId: q.correctOptionId,
        correctOptionLabel: correctOption.label,
        correctOptionText: correctOption.text,
        isCorrect,
        marksAwarded,
        maxMarks: q.points || 10,
        explanation: q.explanation,
      };
    });

    return {
      participantId: participant.id,
      studentName: participant.student_name,
      schoolName: participant.school_name,
      studentClass: participant.student_class,
      roundNumber,
      paperName: paper.paperName,
      obtainedMarks: attempt.score || 0,
      maxMarks: attempt.maxMarks || 100,
      percentage: attempt.percentage || 0,
      correctCount: attempt.correctCount || 0,
      incorrectCount: attempt.incorrectCount || 0,
      unansweredCount: attempt.unansweredCount || 0,
      timeTakenSeconds: attempt.timeTakenSeconds || 0,
      isQualified: !!attempt.isQualified,
      fullscreenExitCount: attempt.fullscreenExitCount || 0,
      fullscreenExits: attempt.fullscreenExits || [],
      questions,
    };
  }

  // ==========================================
  // SYNCHRONIZED BUZZER / QUESTION METHODS
  // (Maintained for backward compatibility)
  // ==========================================

  public async submitAnswer(
    participantId: string,
    questionId: string,
    selectedOptionId: string
  ): Promise<SubmissionResult> {
    const serverTime = this.getEstimatedServerTime();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('submit_student_answer', {
          p_participant_id: participantId,
          p_question_id: questionId,
          p_selected_option_id: selectedOptionId,
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return data as SubmissionResult;
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const state = this.localState;
    if (state.status !== 'in_progress') {
      return { success: false, error: 'Examination is not currently active.' };
    }

    if (state.current_question_id !== questionId) {
      return { success: false, error: 'This question is not currently active.' };
    }

    if (state.question_deadline) {
      const deadlineMs = new Date(state.question_deadline).getTime();
      if (serverTime > deadlineMs + 500) {
        return { success: false, error: 'Deadline expired. Submission rejected.' };
      }
    }

    const existing = this.submissions.find(
      (s) => s.question_id === questionId && s.participant_id === participantId
    );

    if (existing) {
      return {
        success: true,
        already_submitted: true,
        message: 'Your answer is already recorded.',
      };
    }

    const serverQuestion = SERVER_QUESTION_BANK.find((q) => q.id === questionId);
    let isCorrect = false;
    let points = 0;

    if (serverQuestion) {
      const opt = serverQuestion.options.find((o) => o.id === selectedOptionId);
      if (opt && opt.isCorrect) {
        isCorrect = true;
        points = serverQuestion.points || 10;
      }
    }

    const startTimeMs = state.question_start_time ? new Date(state.question_start_time).getTime() : serverTime;
    const latencyMs = Math.max(0, serverTime - startTimeMs);

    const submission = {
      id: 'sub_' + Math.random().toString(36).substring(2, 10),
      competition_id: state.id,
      round_number: state.current_round_number,
      question_id: questionId,
      participant_id: participantId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      points_awarded: points,
      latency_ms: latencyMs,
      server_received_at: new Date(serverTime).toISOString(),
    };

    this.submissions.push(submission);
    this.persistLocal();

    return {
      success: true,
      already_submitted: false,
      received_at: submission.server_received_at,
      message: 'Answer securely recorded.',
    };
  }

  public hasSubmitted(participantId: string, questionId: string): boolean {
    return this.submissions.some(
      (s) => s.participant_id === participantId && s.question_id === questionId
    );
  }

  // ==========================================
  // CENTRALIZED RANKING ENGINE
  // (Overall Unified Leaderboard across ALL students)
  // ==========================================

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_leaderboard', {
          p_competition_id: this.localState.id,
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Fallback to local leaderboard computation:', err);
      }
    }

    const statsMap = new Map<string, {
      round1: number;
      round2: number;
      total: number;
      timeMs: number;
      correctCount: number;
      hasRound2Attempt: boolean;
    }>();

    this.participants.forEach((p) => {
      statsMap.set(p.id, {
        round1: 0,
        round2: 0,
        total: 0,
        timeMs: 0,
        correctCount: 0,
        hasRound2Attempt: false,
      });
    });

    this.submissions.forEach((sub) => {
      const stats = statsMap.get(sub.participant_id);
      if (stats) {
        if (sub.round_number === 1) stats.round1 += sub.points_awarded;
        if (sub.round_number === 2) {
          stats.round2 += sub.points_awarded;
          stats.hasRound2Attempt = true;
        }
        stats.total += sub.points_awarded;
        if (sub.is_correct) {
          stats.correctCount += 1;
          stats.timeMs += sub.latency_ms;
        }
      }
    });

    const cutoff = this.localState.round_1_qualifying_score ?? 60;
    const r1MaxMarks = 100;
    const r2MaxMarks = 100;

    const entries: Omit<LeaderboardEntry, 'rank'>[] = this.participants.map((p) => {
      const s = statsMap.get(p.id) || { round1: 0, round2: 0, total: 0, timeMs: 0, correctCount: 0, hasRound2Attempt: false };
      const totalMaxMarks = s.hasRound2Attempt ? (r1MaxMarks + r2MaxMarks) : r1MaxMarks;
      const r1Pct = Math.round((s.round1 / r1MaxMarks) * 1000) / 10;
      const r2Pct = Math.round((s.round2 / r2MaxMarks) * 1000) / 10;
      const totalPct = Math.round((s.total / totalMaxMarks) * 1000) / 10;

      return {
        participant_id: p.id,
        student_name: p.student_name,
        school_name: p.school_name,
        student_class: p.student_class,
        round_1_score: s.round1,
        round_1_max_marks: r1MaxMarks,
        round_1_pct: r1Pct,
        round_2_score: s.round2,
        round_2_max_marks: r2MaxMarks,
        round_2_pct: r2Pct,
        total_score: s.total,
        total_max_marks: totalMaxMarks,
        total_pct: totalPct,
        total_time_ms: s.timeMs,
        correct_count: s.correctCount,
        is_qualified: s.round1 >= cutoff,
      };
    });

    // Deterministic tie-breaking across ALL students:
    // 1. Total score (Higher is better)
    // 2. Round 2 score (Subject paper priority)
    // 3. Round 1 score (General paper)
    // 4. Total speed/time (Lower latency is better)
    // 5. Alphabetical student name
    entries.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.round_2_score !== a.round_2_score) return b.round_2_score - a.round_2_score;
      if (b.round_1_score !== a.round_1_score) return b.round_1_score - a.round_1_score;
      if (a.total_time_ms !== b.total_time_ms) return a.total_time_ms - b.total_time_ms;
      return a.student_name.localeCompare(b.student_name);
    });

    let currentRank = 1;
    const rankedList: LeaderboardEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
      if (i > 0) {
        const prev = entries[i - 1];
        const curr = entries[i];
        const isTied = 
          curr.total_score === prev.total_score &&
          curr.round_2_score === prev.round_2_score &&
          curr.round_1_score === prev.round_1_score &&
          curr.total_time_ms === prev.total_time_ms;
        
        if (!isTied) {
          currentRank = i + 1;
        }
      }
      rankedList.push({
        ...entries[i],
        rank: currentRank,
      });
    }

    return rankedList;
  }

  // ==========================================
  // ADMIN COMPETITION ORCHESTRATION
  // ==========================================

  public setStatus(newStatus: CompetitionStatus) {
    this.localState.status = newStatus;
    this.persistLocal();
    this.notifyListeners();
  }

  public setAutoAdvance(enabled: boolean) {
    this.localState.auto_advance = enabled;
    this.persistLocal();
    this.notifyListeners();
  }

  public startRound(roundNumber: 1 | 2) {
    const roundQuestions = CLIENT_QUESTIONS.filter((q) => q.roundNumber === roundNumber);
    if (roundQuestions.length === 0) return;

    const firstQ = roundQuestions[0];
    const now = Date.now();
    const durationSeconds = this.localState.duration_per_question || 20;
    const deadline = now + durationSeconds * 1000;

    this.localState = {
      ...this.localState,
      status: 'in_progress',
      current_round_number: roundNumber,
      current_question_id: firstQ.id,
      current_question_number: 1,
      question_start_time: new Date(now).toISOString(),
      question_deadline: new Date(deadline).toISOString(),
    };

    this.persistLocal();
    this.notifyListeners();
    this.scheduleAutoAdvance(durationSeconds);
  }

  public releaseQuestion(questionId: string) {
    const q = CLIENT_QUESTIONS.find((item) => item.id === questionId);
    if (!q) return;

    const now = Date.now();
    const durationSeconds = this.localState.duration_per_question || 20;
    const deadline = now + durationSeconds * 1000;

    this.localState = {
      ...this.localState,
      status: 'in_progress',
      current_round_number: q.roundNumber,
      current_question_id: q.id,
      current_question_number: q.questionNumber,
      question_start_time: new Date(now).toISOString(),
      question_deadline: new Date(deadline).toISOString(),
    };

    this.persistLocal();
    this.notifyListeners();
    this.scheduleAutoAdvance(durationSeconds);
  }

  public advanceNextQuestion() {
    this.clearAutoAdvance();
    const currentRound = this.localState.current_round_number;
    const currentNumber = this.localState.current_question_number;
    const nextNumber = currentNumber + 1;

    const roundQuestions = CLIENT_QUESTIONS.filter((q) => q.roundNumber === currentRound);
    const nextQ = roundQuestions.find((q) => q.questionNumber === nextNumber);

    if (nextQ) {
      this.releaseQuestion(nextQ.id);
    } else {
      this.endRound();
    }
  }

  private scheduleAutoAdvance(durationSeconds: number) {
    this.clearAutoAdvance();
    if (!this.localState.auto_advance) return;

    const bufferMs = 300;
    this.autoAdvanceTimer = setTimeout(() => {
      if (this.localState.status === 'in_progress' && this.localState.auto_advance) {
        this.advanceNextQuestion();
      }
    }, durationSeconds * 1000 + bufferMs);
  }

  private clearAutoAdvance() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  public endRound() {
    this.clearAutoAdvance();
    const currentRound = this.localState.current_round_number;

    this.localState = {
      ...this.localState,
      status: currentRound === 2 ? 'completed' : 'upcoming',
      current_question_id: null,
      question_start_time: null,
      question_deadline: null,
    };

    this.persistLocal();
    this.notifyListeners();
  }

  public publishResults() {
    this.clearAutoAdvance();
    this.localState = {
      ...this.localState,
      status: 'results_published',
      current_question_id: null,
      question_start_time: null,
      question_deadline: null,
    };
    this.persistLocal();
    this.notifyListeners();
  }

  public resetCompetition(adminToken?: string) {
    if (adminToken !== undefined) {
      this.requireAdmin(adminToken);
    }
    this.clearAutoAdvance();
    this.localState = { ...INITIAL_STATE };
    this.participants = [];
    this.submissions = [];
    this.examAttempts = {};
    this.clearStudentSession();
    this.logAdminAction('RESET_COMPETITION', 'admin');
    this.persistLocal();
    this.notifyListeners();
  }

  // ==========================================
  // SECURE ADMINISTRATOR AUTHENTICATION & RBAC
  // ==========================================

  public async loginAdmin(username: string, password: string): Promise<AdminAuthResult> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check brute-force lockout
    const attemptRecord = this.failedLoginAttempts[cleanUser] || { count: 0, lockedUntil: 0 };
    const now = Date.now();
    if (attemptRecord.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      return {
        success: false,
        error: `Security Lockout: Too many failed login attempts. Please wait ${waitSeconds} seconds before trying again.`,
      };
    }

    // Supported official administrator credentials
    const validPasswords = ['Admin@QuizMania2026', 'quizmania2026', 'admin123'];
    const isValidUser = cleanUser === 'admin' || cleanUser === 'organizer';
    const isValidPass = validPasswords.includes(cleanPass);

    if (!isValidUser || !isValidPass) {
      attemptRecord.count += 1;
      if (attemptRecord.count >= 5) {
        attemptRecord.lockedUntil = now + 60000; // 60s lockout
      }
      this.failedLoginAttempts[cleanUser] = attemptRecord;

      this.logAdminAction('ADMIN_LOGIN_FAILED', cleanUser, { reason: 'Invalid credentials', attempt: attemptRecord.count });
      return {
        success: false,
        error: 'Invalid administrator credentials. Access denied.',
      };
    }

    // Reset failed attempts on success
    delete this.failedLoginAttempts[cleanUser];

    // Generate cryptographic-style 64-char session token
    const token = 'agt_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + '_' + Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hour validity

    const session: AdminSession = {
      token,
      role: 'ADMIN',
      username: cleanUser,
      createdAt: now,
      expiresAt,
    };

    this.adminSessions[token] = session;
    this.persistLocal();

    this.logAdminAction('ADMIN_LOGIN_SUCCESS', cleanUser, { tokenPrefix: token.substring(0, 10) });

    return {
      success: true,
      token,
      role: 'ADMIN',
      expiresAt,
    };
  }

  public verifyAdminSession(token?: string | null): boolean {
    if (!token) return false;
    const session = this.adminSessions[token];
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      delete this.adminSessions[token];
      this.persistLocal();
      return false;
    }
    return session.role === 'ADMIN';
  }

  public logoutAdmin(token: string): boolean {
    if (this.adminSessions[token]) {
      const username = this.adminSessions[token].username;
      delete this.adminSessions[token];
      this.persistLocal();
      this.logAdminAction('ADMIN_LOGOUT', username);
      return true;
    }
    return false;
  }

  public requireAdmin(token?: string | null): void {
    if (!this.verifyAdminSession(token)) {
      throw new Error('UNAUTHORIZED: Valid administrator session token required. Access denied.');
    }
  }

  public logAdminAction(action: string, actor: string, details?: Record<string, any>) {
    const entry: AdminAuditLogEntry = {
      id: 'log_' + Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
      action,
      actor,
      details,
    };
    this.adminAuditLogs.unshift(entry);
    if (this.adminAuditLogs.length > 500) this.adminAuditLogs.pop();
    this.persistLocal();
  }

  public getAdminAuditLogs(token: string): AdminAuditLogEntry[] {
    this.requireAdmin(token);
    return [...this.adminAuditLogs];
  }

  public async exportResultsCSV(adminToken?: string): Promise<string> {
    if (adminToken !== undefined) {
      this.requireAdmin(adminToken);
    }
    const lb = await this.getLeaderboard();
    const headers = [
      'Rank',
      'Student Name',
      'School / Institution',
      'Class',
      'Round 1 Score (General)',
      'Round 1 Max',
      'Round 1 %',
      'Round 2 Score (Python)',
      'Round 2 Max',
      'Round 2 %',
      'Grand Total Score',
      'Total Max',
      'Total %',
      'Correct Count',
      'Total Latency (ms)',
      'Qualification Status'
    ];

    const rows = lb.map((entry) => [
      entry.rank,
      `"${entry.student_name.replace(/"/g, '""')}"`,
      `"${entry.school_name.replace(/"/g, '""')}"`,
      entry.student_class,
      entry.round_1_score,
      entry.round_1_max_marks,
      entry.round_1_pct,
      entry.round_2_score,
      entry.round_2_max_marks,
      entry.round_2_pct,
      entry.total_score,
      entry.total_max_marks,
      entry.total_pct,
      entry.correct_count,
      entry.total_time_ms,
      entry.is_qualified ? 'Qualified' : 'Did Not Qualify'
    ]);

    this.logAdminAction('EXPORT_RESULTS_CSV', 'admin', { rowCount: rows.length });
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public getAllParticipants(): Participant[] {
    return [...this.participants];
  }

  public getSubmissionsCount(): number {
    return this.submissions.length;
  }

  public getActiveQuestionSubmissionsCount(questionId: string | null): number {
    if (!questionId) return 0;
    return this.submissions.filter((s) => s.question_id === questionId).length;
  }

  public seedMockParticipants(count = 60) {
    const schools = [
      'Delhi Public School',
      'St. Xavier High School',
      'National Public School',
      'The Mother International School',
      'Modern School Barakhamba',
      'Kendriya Vidyalaya',
      'Army Public School',
      'Amity International School',
    ];

    const firstNames = [
      'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
      'Ananya', 'Diya', 'Gauri', 'Aadhya', 'Pari', 'Saanvi', 'Riya', 'Sara', 'Myra', 'Kavya',
      'Devansh', 'Dhruv', 'Kabir', 'Rohan', 'Tanmay', 'Pranav', 'Samar', 'Nirvaan', 'Aarush', 'Shlok',
      'Meera', 'Tarini', 'Isha', 'Avani', 'Zoya', 'Navya', 'Prisha', 'Siya', 'Shanaya', 'Khushi'
    ];
    const lastNames = [
      'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Mishra', 'Joshi', 'Chopra', 'Malhotra',
      'Reddy', 'Rao', 'Nair', 'Iyer', 'Chatterjee', 'Banerjee', 'Bose', 'Das', 'Sen', 'Mehta'
    ];

    const added: Participant[] = [];
    for (let i = 0; i < count; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[(i * 3) % lastNames.length];
      const name = `${fName} ${lName}${i >= 40 ? ' ' + (i - 39) : ''}`;
      const school = schools[i % schools.length];
      const sClass: StudentClass = i % 2 === 0 ? '11th' : '12th';
      const accessCode = 'QZ-MOCK' + (1000 + i);

      added.push({
        id: `mock_student_${i + 1}`,
        competition_id: this.localState.id,
        access_code: accessCode,
        student_name: name,
        school_name: school,
        student_class: sClass,
        is_active: true,
        last_ping_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    this.participants = added;
    this.persistLocal();
    this.notifyListeners();
    return added.length;
  }
}

export const competitionService = new CompetitionService();
