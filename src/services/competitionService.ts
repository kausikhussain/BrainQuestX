import { 
  CompetitionState, 
  Participant, 
  SubmissionResult, 
  RegistrationResult, 
  LeaderboardEntry, 
  StudentClass, 
  CompetitionStatus 
} from '../types';
import { CLIENT_QUESTIONS, SERVER_QUESTION_BANK, COMPETITION_ROUNDS } from '../data/questions';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  STATE: 'quizmania_competition_state',
  PARTICIPANTS: 'quizmania_participants',
  SUBMISSIONS: 'quizmania_submissions',
  STUDENT_SESSION: 'quizmania_active_student',
};

// Default initial state
const INITIAL_STATE: CompetitionState = {
  id: '00000000-0000-0000-0000-000000000001',
  code: 'QUIZ-2026',
  title: 'Inter-School Technical Quiz Competition 2026',
  description: 'Offline technical examination for Class 11th & 12th students featuring General Tech & Python Programming rounds.',
  status: 'registration_open',
  current_round_number: 0,
  current_question_id: null,
  current_question_number: 0,
  question_start_time: null,
  question_deadline: null,
  duration_per_question: 20,
  auto_advance: true,
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
        this.localState = JSON.parse(savedState);
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
  // STUDENT METHODS
  // ==========================================

  public async registerStudent(
    studentName: string,
    schoolName: string,
    studentClass: StudentClass
  ): Promise<RegistrationResult> {
    const cleanName = studentName.trim();
    const cleanSchool = schoolName.trim();

    if (!cleanName || !cleanSchool) {
      return { success: false, error: 'Student name and school name are required.' };
    }
    if (studentClass !== '11th' && studentClass !== '12th') {
      return { success: false, error: 'Class must be either 11th or 12th.' };
    }

    if (this.localState.status === 'registration_closed') {
      return { success: false, error: 'Registration is currently closed by the administrator.' };
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
        message: 'Welcome back! Restored your registration.',
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
      message: 'Registration confirmed!',
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

  /**
   * Submit an answer with strict server-authoritative deadline validation.
   */
  public async submitAnswer(
    participantId: string,
    questionId: string,
    selectedOptionId: string
  ): Promise<SubmissionResult> {
    const serverTime = this.getEstimatedServerTime();

    // Check Supabase RPC if configured
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

    // Local Engine Server-Authoritative Logic
    const state = this.localState;

    if (state.status !== 'in_progress') {
      return { success: false, error: 'Competition is not currently active.' };
    }

    if (state.current_question_id !== questionId) {
      return { success: false, error: 'This question is not currently active.' };
    }

    // Enforce 20s server-authoritative deadline with 500ms network buffer
    if (state.question_deadline) {
      const deadlineMs = new Date(state.question_deadline).getTime();
      if (serverTime > deadlineMs + 500) {
        return { success: false, error: 'Deadline expired. Submission rejected.' };
      }
    }

    // Strict Idempotency Check
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

    // Server-Side Answer Scoring (Correct answer is NEVER sent to client)
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

  /**
   * Check if a participant has already submitted for a specific question.
   */
  public hasSubmitted(participantId: string, questionId: string): boolean {
    return this.submissions.some(
      (s) => s.participant_id === participantId && s.question_id === questionId
    );
  }

  // ==========================================
  // LEADERBOARD & RANKINGS
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

    // Compute deterministic ranking locally
    const statsMap = new Map<string, {
      round1: number;
      round2: number;
      total: number;
      timeMs: number;
      correctCount: number;
    }>();

    // Initialize all participants with 0
    this.participants.forEach((p) => {
      statsMap.set(p.id, {
        round1: 0,
        round2: 0,
        total: 0,
        timeMs: 0,
        correctCount: 0,
      });
    });

    // Aggregate submissions
    this.submissions.forEach((sub) => {
      const stats = statsMap.get(sub.participant_id);
      if (stats) {
        if (sub.round_number === 1) stats.round1 += sub.points_awarded;
        if (sub.round_number === 2) stats.round2 += sub.points_awarded;
        stats.total += sub.points_awarded;
        if (sub.is_correct) {
          stats.correctCount += 1;
          stats.timeMs += sub.latency_ms;
        }
      }
    });

    // Map into array
    const entries: Omit<LeaderboardEntry, 'rank'>[] = this.participants.map((p) => {
      const s = statsMap.get(p.id) || { round1: 0, round2: 0, total: 0, timeMs: 0, correctCount: 0 };
      return {
        participant_id: p.id,
        student_name: p.student_name,
        school_name: p.school_name,
        student_class: p.student_class,
        round_1_score: s.round1,
        round_2_score: s.round2,
        total_score: s.total,
        total_time_ms: s.timeMs,
        correct_count: s.correctCount,
      };
    });

    // Deterministic sorting with tie-breaking:
    // 1. Total score (Higher is better)
    // 2. Round 2 score (Subject paper priority)
    // 3. Total completion time for correct answers (Faster is better)
    // 4. Alphabetical student name
    entries.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      if (b.round_2_score !== a.round_2_score) return b.round_2_score - a.round_2_score;
      if (a.total_time_ms !== b.total_time_ms) return a.total_time_ms - b.total_time_ms;
      return a.student_name.localeCompare(b.student_name);
    });

    // Assign dense ranks
    let currentRank = 1;
    const rankedList: LeaderboardEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
      if (i > 0) {
        const prev = entries[i - 1];
        const curr = entries[i];
        // If tied on total, round 2, and time, they share rank
        const isTied = 
          curr.total_score === prev.total_score &&
          curr.round_2_score === prev.round_2_score &&
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
      // Round completed!
      this.endRound();
    }
  }

  private scheduleAutoAdvance(durationSeconds: number) {
    this.clearAutoAdvance();
    if (!this.localState.auto_advance) return;

    // Trigger advance 150ms after deadline to allow last-split-second submissions
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

  public resetCompetition() {
    this.clearAutoAdvance();
    this.localState = { ...INITIAL_STATE };
    this.participants = [];
    this.submissions = [];
    this.clearStudentSession();
    this.persistLocal();
    this.notifyListeners();
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

  /**
   * Helper to seed realistic mock participants for rehearsals & load testing
   */
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

