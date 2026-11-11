import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldAlert, 
  Info,
  CheckSquare,
  Square,
  Maximize2,
  Shuffle,
  Award,
  Lock
} from 'lucide-react';
import { CompetitionState, Participant } from '../../types';

interface ExamInstructionsViewProps {
  participant: Participant;
  competitionState: CompetitionState;
  roundNumber?: 1 | 2;
  onStartExam: () => void;
  onBackToWelcome: () => void;
}

export const ExamInstructionsView: React.FC<ExamInstructionsViewProps> = ({
  participant,
  competitionState,
  roundNumber = 1,
  onStartExam,
  onBackToWelcome,
}) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const roundTitle = roundNumber === 1 ? 'Round 1: General Paper' : 'Round 2: Subject Paper (Python)';

  const handleStartWithFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request declined or unsupported by browser:', err);
    }
    onStartExam();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pt-8 sm:pb-16 animate-fadeIn">
      {/* Top Back Navigation */}
      <button
        onClick={onBackToWelcome}
        className="inline-flex items-center gap-1.5 text-xs text-[#647084] hover:text-[#172033] font-medium transition-colors mb-6 pt-1 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Candidate Briefing</span>
      </button>

      {/* Main Instructions Container */}
      <div className="bg-white border border-[#E7EAF0] rounded-3xl shadow-soft overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 border-b border-[#E7EAF0] bg-[#F8F9FC]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#465FE5] uppercase tracking-wider font-mono mb-2">
            <span>Official Examination Protocol</span>
            <span>&bull;</span>
            <span>{roundTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Examination Rules & Instructions
          </h1>
          <p className="text-xs sm:text-sm text-[#647084] mt-1 max-w-2xl">
            Please read these requirements carefully. The examination platform operates under strict server-authoritative rules and continuous telemetric monitoring.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Overview Matrix */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#647084] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#465FE5]" />
              1. Structure & Scoring Rules
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
                <span className="block text-[10px] font-semibold text-[#647084] uppercase font-mono">Questions</span>
                <span className="text-2xl font-black text-[#172033] font-mono mt-0.5 block">10</span>
                <span className="text-[11px] text-[#647084] mt-0.5 block">Single Choice</span>
              </div>

              <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
                <span className="block text-[10px] font-semibold text-[#647084] uppercase font-mono">Timer</span>
                <span className="text-2xl font-black text-[#465FE5] font-mono mt-0.5 block">20s</span>
                <span className="text-[11px] text-[#647084] mt-0.5 block">Per Question</span>
              </div>

              <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
                <span className="block text-[10px] font-semibold text-[#647084] uppercase font-mono">Marking</span>
                <span className="text-2xl font-black text-[#16845B] font-mono mt-0.5 block">+10</span>
                <span className="text-[11px] text-[#647084] mt-0.5 block">0 Negatives</span>
              </div>

              <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
                <span className="block text-[10px] font-semibold text-[#647084] uppercase font-mono">Qualifying Cutoff</span>
                <span className="text-2xl font-black text-[#B7791F] font-mono mt-0.5 block">&ge; 60%</span>
                <span className="text-[11px] text-[#647084] mt-0.5 block">For Round 2</span>
              </div>
            </div>
          </div>

          {/* Section 2: Four Core Rules Cards */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#647084] mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B7791F]" />
              2. Mandatory Examination Protocol
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Rule A: 20s Per-Question Countdown */}
              <div className="p-4 rounded-xl border border-[#E7EAF0] bg-white shadow-soft-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E9EDFF] text-[#465FE5] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase">
                    Strict 20-Second Active Limit
                  </h3>
                </div>
                <p className="text-xs text-[#647084] leading-relaxed">
                  Each question has an individual 20-second countdown. At <span className="font-mono text-[#172033] font-bold">00:00</span>, the question locks and automatically advances to the next question. Expired questions cannot be revisited.
                </p>
              </div>

              {/* Rule B: Question Randomization */}
              <div className="p-4 rounded-xl border border-[#E7EAF0] bg-white shadow-soft-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E9EDFF] text-[#465FE5] flex items-center justify-center">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase">
                    Independent Randomization
                  </h3>
                </div>
                <p className="text-xs text-[#647084] leading-relaxed">
                  Every candidate receives an independently shuffled question sequence generated on the server. Reloading or refreshing will preserve your assigned sequence without reshuffling.
                </p>
              </div>

              {/* Rule C: Mandatory Full-Screen Security */}
              <div className="p-4 rounded-xl border border-[#E7EAF0] bg-white shadow-soft-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#B7791F] flex items-center justify-center">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase">
                    Mandatory Full-Screen Mode
                  </h3>
                </div>
                <p className="text-xs text-[#647084] leading-relaxed">
                  Full-screen mode is initiated automatically. Exiting full-screen displays a warning overlay and logs the timestamp in the official administrator audit log.
                </p>
              </div>

              {/* Rule D: Continuous Zero-Loss Auto-Save */}
              <div className="p-4 rounded-xl border border-[#E7EAF0] bg-white shadow-soft-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#16845B] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase">
                    Continuous Zero-Loss Auto-Save
                  </h3>
                </div>
                <p className="text-xs text-[#647084] leading-relaxed">
                  Selected answers are saved synchronously to your candidate session. Even if your browser crashes or disconnects, your progress is immediately recoverable.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: Honor Code Agreement Checkbox */}
          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-2xl p-5 sm:p-6">
            <label className="flex items-start gap-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#D1D7E2] text-[#465FE5] focus:ring-[#465FE5] cursor-pointer"
              />
              <div className="text-xs text-[#172033] leading-relaxed">
                <span className="font-bold block text-sm mb-0.5">
                  Candidate Honor Pledge & Technical Consent
                </span>
                <span>
                  I confirm that I am <strong className="text-[#172033]">{participant.student_name}</strong> from <strong className="text-[#172033]">{participant.school_name}</strong>. I will complete this examination independently without unauthorized aids, external communication, or tab-switching. I consent to full-screen telemetric logging.
                </span>
              </div>
            </label>
          </div>

          {/* Section 4: Start Exam Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E7EAF0]">
            <div className="text-xs text-[#647084]">
              {hasConfirmed ? (
                <span className="text-[#16845B] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Pledge accepted. Ready to enter examination workspace.
                </span>
              ) : (
                <span className="text-[#B7791F] font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Please accept the candidate honor pledge to enable examination entry.
                </span>
              )}
            </div>

            {competitionState.status === 'in_progress' && competitionState.current_round_number === roundNumber ? (
              <button
                onClick={handleStartWithFullscreen}
                disabled={!hasConfirmed}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  hasConfirmed 
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:-translate-y-0.5' 
                    : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Start Examination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Waiting for Organizer to start Round {roundNumber}...</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
