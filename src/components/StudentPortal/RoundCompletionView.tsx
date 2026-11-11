import React from 'react';
import { CheckCircle2, Trophy, Clock, ArrowRight, Award } from 'lucide-react';
import { CompetitionState, Participant } from '../../types';

interface RoundCompletionViewProps {
  participant: Participant;
  competitionState: CompetitionState;
  onViewLeaderboard: () => void;
}

export const RoundCompletionView: React.FC<RoundCompletionViewProps> = ({
  participant,
  competitionState,
  onViewLeaderboard,
}) => {
  const isFinalCompletion = competitionState.status === 'completed' || competitionState.status === 'results_published';

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/10">
        {isFinalCompletion ? (
          <Trophy className="w-8 h-8 text-amber-400" />
        ) : (
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
        {isFinalCompletion ? 'Competition Completed!' : 'Round 1 Concluded!'}
      </h2>

      <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
        {isFinalCompletion
          ? 'Great effort! Both the General Paper and Python Subject Paper have finished. Your responses are securely compiled.'
          : 'Round 1 (General Paper) has ended. Please stand by in this room while the administrator opens Round 2 (Python Subject Paper).'}
      </p>

      {/* Participant Summary Card */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-5 mb-8 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-[#19243A] mb-3">
          <span className="text-xs text-slate-400">Candidate Name:</span>
          <span className="text-sm font-bold text-white">{participant.student_name}</span>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-[#19243A] mb-3">
          <span className="text-xs text-slate-400">School & Class:</span>
          <span className="text-xs text-slate-300 font-medium">
            {participant.school_name} (Class {participant.student_class})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Official Access ID:</span>
          <span className="text-xs font-mono font-bold text-cyan-300">{participant.access_code}</span>
        </div>
      </div>

      {competitionState.status === 'results_published' ? (
        <button
          onClick={onViewLeaderboard}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-lg shadow-amber-500/20 cursor-pointer transition-all inline-flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          <span>View Official Leaderboard & Rankings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-[#0B1020] border border-[#22304C] inline-flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>Scores are being calculated. Results will be published by the organizer shortly.</span>
        </div>
      )}
    </div>
  );
};
