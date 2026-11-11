export type CompetitionStatus = 
  | 'upcoming' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'in_progress' 
  | 'completed' 
  | 'results_published';

export type StudentClass = '11th' | '12th';

export interface Participant {
  id: string;
  competition_id: string;
  access_code: string;
  student_name: string;
  school_name: string;
  student_class: StudentClass;
  is_active: boolean;
  last_ping_at: string;
  created_at: string;
}

export interface CompetitionState {
  id: string;
  code: string;
  title: string;
  description: string;
  status: CompetitionStatus;
  current_round_number: number;
  current_question_id: string | null;
  current_question_number: number;
  question_start_time: string | null;
  question_deadline: string | null;
  duration_per_question: number;
  auto_advance: boolean;
  server_time?: number;
  // Qualification configuration
  round_1_qualifying_score?: number; // default: 60 (out of 100)
}

export interface SubmissionRecord {
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
}

export interface LeaderboardEntry {
  rank: number;
  participant_id: string;
  student_name: string;
  school_name: string;
  student_class: StudentClass;
  round_1_score: number;
  round_1_max_marks: number;
  round_1_pct: number;
  round_2_score: number;
  round_2_max_marks: number;
  round_2_pct: number;
  total_score: number;
  total_max_marks: number;
  total_pct: number;
  total_time_ms: number;
  correct_count: number;
  is_qualified?: boolean;
}

export interface SubmissionResult {
  success: boolean;
  already_submitted?: boolean;
  error?: string;
  message?: string;
  received_at?: string;
}

export interface RegistrationResult {
  success: boolean;
  is_duplicate?: boolean;
  participant_id?: string;
  access_code?: string;
  student_name?: string;
  school_name?: string;
  student_class?: StudentClass;
  message?: string;
  error?: string;
}

/**
 * Self-Directed Student Examination Attempt
 * Tracks end-to-end examination state, per-question timers, randomized sequences, and full-screen events
 */
export interface QuestionTimerState {
  questionId: string;
  firstDisplayedAt: number;
  durationSeconds: number; // 20 seconds standard
  deadlineTime: number; // firstDisplayedAt + 20000ms
  isLocked: boolean;
  isExpired: boolean;
  timeSpentMs: number;
  submittedAt?: number;
}

export interface FullscreenExitEvent {
  timestamp: number;
  returnedAt?: number;
}

export interface StudentExamAttempt {
  attemptId: string;
  participantId: string;
  roundNumber: 1 | 2;
  paperId: string;
  paperName: string;
  startTime: number;
  durationSeconds: number; // nominal total (e.g. 200 seconds for 10 questions)
  deadlineTime: number;
  // Randomized assigned question sequence (immutable IDs in assigned order)
  questionSequence: string[];
  currentQuestionIndex: number;
  // Per-question timer records (20 seconds per question)
  questionTimers: Record<string, QuestionTimerState>;
  // Full-screen telemetry
  fullscreenExitCount: number;
  fullscreenExits: FullscreenExitEvent[];
  // Answers & UI state
  answers: Record<string, string>; // questionId -> selectedOptionId
  visitedQuestionIds: string[];
  markedForReviewIds: string[];
  isSubmitted: boolean;
  submittedAt?: string;
  // Final calculated results
  score?: number;
  maxMarks?: number;
  percentage?: number;
  totalQuestions?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  timeTakenSeconds?: number;
  isQualified?: boolean;
}

// User & Admin Roles
export type UserRole = 'STUDENT' | 'ADMIN';

export interface AdminSession {
  token: string;
  role: 'ADMIN';
  username: string;
  createdAt: number;
  expiresAt: number;
}

export interface AdminAuthResult {
  success: boolean;
  token?: string;
  role?: 'ADMIN';
  expiresAt?: number;
  error?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  details?: Record<string, any>;
}

export type QuestionNavStatus = 
  | 'not_visited' 
  | 'visited_unanswered' 
  | 'answered' 
  | 'marked_for_review'
  | 'locked'
  | 'expired';

export interface ExamReviewSummary {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedForReviewCount: number;
}

export interface QuestionAuditDetail {
  questionNumber: number;
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  selectedOptionLabel: string | null;
  selectedOptionText: string | null;
  correctOptionId: string;
  correctOptionLabel: string;
  correctOptionText: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation?: string;
}

export interface AttemptAuditReport {
  participantId: string;
  studentName: string;
  schoolName: string;
  studentClass: StudentClass;
  roundNumber: 1 | 2;
  paperName: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  isQualified: boolean;
  fullscreenExitCount?: number;
  fullscreenExits?: FullscreenExitEvent[];
  questions: QuestionAuditDetail[];
}

export type { 
  Question, 
  QuestionOption, 
  CompetitionRound,
  ExamPaperMapping,
  MarkingScheme
} from '../data/questions';
