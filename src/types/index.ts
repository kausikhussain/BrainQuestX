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
  round_2_score: number;
  total_score: number;
  total_time_ms: number;
  correct_count: number;
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

export type { Question, QuestionOption, QuestionWithAnswer } from '../data/questions';
