import React from 'react';
import { 
  UserCheck, 
  Clock, 
  BookOpen, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  LogOut,
  Radio
} from 'lucide-react';
import { CompetitionState, Participant } from '../../types';

interface WaitingRoomViewProps {
  participant: Participant;
  competitionState: CompetitionState;
  onLeaveSession: () => void;
  onEnterQuizNow?: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  participant,
  competitionState,
  onLeaveSession,
  onEnterQuizNow,
}) => {
  const isRoundActive = competitionState.status === 'in_progress' && !!competitionState.current_question_id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {participant.student_name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {participant.school_name} • <span className="text-indigo-400 font-semibold">Class {participant.student_class}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLeaveSession}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Badge</span>
          </button>
        </div>

        {/* Participant ID Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#19243A]">
          <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#22304C]/60 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Participant ID:</span>
            <span className="font-mono font-bold text-sm text-cyan-300 tracking-wider">
              {participant.access_code}
            </span>
          </div>

          <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#22304C]/60 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Live Server Status:</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                Connected & Synchronized
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Competition Status Alert */}
      <div className={`p-6 rounded-2xl border mb-6 transition-all ${
        isRoundActive 
          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
          : 'bg-[#121A2B]/80 border-[#22304C]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isRoundActive ? 'bg-indigo-400 animate-ping' : 'bg-amber-400 animate-pulse'
            }`} />
            <div>
              <h3 className="text-base font-bold text-white">
                {isRoundActive 
                  ? `Round ${competitionState.current_round_number} is LIVE!` 
                  : 'Waiting for Administrator to Start...'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRoundActive 
                  ? `Question ${competitionState.current_question_number} is currently active.`
                  : 'Please keep this tab open. The quiz will begin automatically when the administrator releases Round 1.'}
              </p>
            </div>
          </div>

          {isRoundActive && onEnterQuizNow && (
            <button
              onClick={onEnterQuizNow}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer animate-pulse transition-all"
            >
              Enter Active Quiz
            </button>
          )}
        </div>
      </div>

      {/* Competition Schedule & Rounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl border transition-all ${
          competitionState.current_round_number === 1 && isRoundActive
            ? 'bg-indigo-950/30 border-indigo-500/40'
            : 'bg-[#121A2B] border-[#22304C]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase">Round 1</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              10 Questions • 20s each
            </span>
          </div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            General Paper (Tech & Hardware)
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Communication devices, file formats, memory architecture, MS Office.
          </p>
        </div>

        <div className={`p-4 rounded-xl border transition-all ${
          competitionState.current_round_number === 2 && isRoundActive
            ? 'bg-cyan-950/30 border-cyan-500/40'
            : 'bg-[#121A2B] border-[#22304C]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">Round 2</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              10 Questions • 20s each
            </span>
          </div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            Subject Paper (Python Programming)
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Syntax, mutability, built-in string/list functions, loop mechanics.
          </p>
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="bg-[#0B1020] border border-[#22304C] rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Important Instructions
        </h4>
        <ul className="space-y-2.5 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Each question has <strong>EXACTLY 20 seconds</strong>. Time starts immediately when the question appears on screen.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Click any option card to submit. Once clicked, your answer is <strong>locked</strong> and cannot be altered.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Do not refresh your browser during an active question. If disconnected, simply reload; your server timer will seamlessly resume.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Unanswered questions receive 0 marks. Correct answers award 10 points. No negative marking.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
