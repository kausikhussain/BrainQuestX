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
  Shuffle
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
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn">
      {/* Top Back Navigation */}
      <button
        onClick={onBackToWelcome}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Candidate Briefing</span>
      </button>

      {/* Main Instructions Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider font-mono mb-2">
            <span>Official Examination Protocol</span>
            <span>&bull;</span>
            <span>{roundTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Examination Instructions & Guidelines
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Please review the following rules thoroughly. Each question is governed by an authoritative 20-second countdown and requires active full-screen mode.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Overview Matrix */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              1. Examination Structure
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Questions</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">10</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Per Question</span>
                <span className="text-xl font-extrabold text-indigo-600 font-mono mt-0.5 block">20 Secs</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Total Marks</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">100 Pts</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Format</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">MCQ (A-D)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Core Examination Rules */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              2. Strict 20-Second Per-Question Timing & Auto-Advancement
            </h2>
            <div className="space-y-2.5 text-sm text-slate-700 bg-slate-50/50 border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  <strong>Independent 20-Second Countdown:</strong> Every single question is allocated exactly 20 seconds of server-authoritative time. Refreshing your browser does not reset or pause the countdown.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  <strong>Automatic Question Advancement:</strong> When the 20-second timer reaches 00:00, your selected answer is automatically saved and locked, and the next question loads immediately.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  <strong>Question Randomization:</strong> Each student receives a uniquely randomized question sequence generated on the server to ensure absolute examination fairness.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <p>
                  <strong>No Penalty:</strong> There is no negative marking (+10 for correct, 0 for incorrect/unanswered). Selecting an answer promptly is strongly recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Full-Screen Mode Mandatory */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-600" />
              3. Full-Screen Mode & Examination Integrity
            </h2>
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs text-indigo-950 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Clicking <strong>"Start Examination"</strong> will automatically request full-screen mode. You must remain in full-screen for the duration of the assessment.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Exiting full-screen will display an immediate warning overlay and is logged with timestamps for administrative review.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Question Status Palette Legend */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              4. Question Palette Status Legend
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </span>
                <span className="text-indigo-900 font-medium">Active (Current)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </span>
                <span className="text-emerald-900 font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/60">
                <span className="w-7 h-7 rounded-lg border border-amber-300 bg-amber-100 flex items-center justify-center font-bold text-amber-800 shrink-0">
                  3
                </span>
                <span className="text-amber-800 font-medium">Expired / Skipped</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="w-7 h-7 rounded-lg border border-slate-300 bg-white flex items-center justify-center font-bold text-slate-400 shrink-0">
                  4
                </span>
                <span className="text-slate-500">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-4 border-t border-slate-100">
            <label 
              onClick={() => setHasConfirmed(!hasConfirmed)}
              className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer select-none transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                {hasConfirmed ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-800 leading-snug">
                I have read and agree to all rules: 20 seconds per question, randomized question sequence, and continuous full-screen mode.
              </span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={onBackToWelcome}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Overview
            </button>

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

