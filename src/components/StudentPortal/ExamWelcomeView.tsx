import React from 'react';
import { 
  UserCheck, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  FileText, 
  ShieldCheck,
  Code2,
  GraduationCap,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';
import { CompetitionState, Participant } from '../../types';
import { COMPETITION_ROUNDS } from '../../data/questions';

interface ExamWelcomeViewProps {
  participant: Participant;
  competitionState: CompetitionState;
  onProceedToInstructions: () => void;
  onSwitchSession: () => void;
  isRound2Eligible?: boolean;
  onStartRound2?: () => void;
}

export const ExamWelcomeView: React.FC<ExamWelcomeViewProps> = ({
  participant,
  competitionState,
  onProceedToInstructions,
  onSwitchSession,
  isRound2Eligible = false,
  onStartRound2,
}) => {
  const round1 = COMPETITION_ROUNDS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pt-8 sm:pb-16 animate-fadeIn">
      {/* Top Breadcrumb & Switch Session */}
      <div className="flex items-center justify-between mb-6 pt-1">
        <div className="flex items-center gap-2 text-xs text-[#647084] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#16845B]" />
          <span>Active Verified Session</span>
          <span>&bull;</span>
          <span className="font-mono font-bold text-[#172033]">{participant.access_code}</span>
        </div>

        <button
          onClick={onSwitchSession}
          className="inline-flex items-center gap-1.5 text-xs text-[#647084] hover:text-[#172033] font-medium px-3 py-1.5 rounded-lg border border-[#E7EAF0] hover:bg-white transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch Candidate</span>
        </button>
      </div>

      {/* Candidate Profile Card */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 sm:p-8 shadow-soft mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5] shadow-soft-sm shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                  Welcome, {participant.student_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9]">
                  <CheckCircle2 className="w-3 h-3 text-[#16845B]" />
                  Verified Candidate
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#647084] mt-1 font-medium">
                <span>{participant.school_name}</span>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#465FE5] font-semibold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Class {participant.student_class || '11th'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl px-4 py-3 sm:text-right shrink-0">
            <div className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Candidate ID</div>
            <div className="text-base font-mono font-extrabold text-[#465FE5] tracking-wide mt-0.5">
              {participant.access_code}
            </div>
          </div>
        </div>
      </div>

      {/* Examination Status & Next Action Card */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 sm:p-8 shadow-soft mb-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#E7EAF0]">
          <div className="w-10 h-10 rounded-xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#465FE5] font-mono">
              Stage 1 Examination
            </div>
            <h2 className="text-xl font-bold text-[#172033]">
              Round 1: General Paper
            </h2>
          </div>
        </div>

        <p className="text-sm text-[#647084] leading-relaxed mb-6">
          Your candidate seat is prepared. Round 1 features exactly 10 multiple-choice questions assessing core computational principles, communications, and binary systems. Each question has a strict 20-second active limit.
        </p>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
            <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Questions</span>
            <span className="text-2xl font-black text-[#172033] font-mono mt-0.5 block">10</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
            <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Pace Limit</span>
            <span className="text-2xl font-black text-[#465FE5] font-mono mt-0.5 block">20s</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
            <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Max Marks</span>
            <span className="text-2xl font-black text-[#172033] font-mono mt-0.5 block">100</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
            <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Qualification</span>
            <span className="text-2xl font-black text-[#16845B] font-mono mt-0.5 block">&ge; 60%</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E7EAF0]">
          <div className="text-xs text-[#647084] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16845B]" />
            <span>Full-screen mode will be requested when initiating the exam</span>
          </div>

          <button
            onClick={onProceedToInstructions}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-[#465FE5] hover:bg-[#384EC9] text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Review Examination Protocol</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Round 2 Preview if eligible */}
      {isRound2Eligible && onStartRound2 && (
        <div className="bg-[#E9EDFF] border border-[#C5D0FF] rounded-2xl p-6 shadow-soft animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#465FE5] text-white flex items-center justify-center shadow-soft-sm">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#465FE5] font-mono">
                  Qualification Confirmed
                </span>
                <h3 className="text-lg font-bold text-[#172033]">
                  Round 2: Subject Paper (Python) Available
                </h3>
              </div>
            </div>

            <button
              onClick={onStartRound2}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#465FE5] hover:bg-[#384EC9] text-white shadow-soft transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Round 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
