import React, { useEffect } from 'react';
import { Trophy, Award, Medal, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry } from '../../types';

interface PodiumProps {
  topThree: LeaderboardEntry[];
  isResultsPublished: boolean;
}

export const Podium: React.FC<PodiumProps> = ({ topThree, isResultsPublished }) => {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  // Trigger celebration confetti when results are published and podium is mounted
  useEffect(() => {
    if (isResultsPublished && first) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#6366F1', '#06B6D4', '#22C55E'],
        });
      } catch {}
    }
  }, [isResultsPublished, first]);

  if (!first) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center">
        {/* 2nd Place (Silver) */}
        {second ? (
          <div className="flex flex-col items-center">
            {/* Avatar Badge */}
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 p-0.5 shadow-lg shadow-slate-500/20">
                <div className="w-full h-full bg-[#121A2B] rounded-[14px] flex items-center justify-center">
                  <Medal className="w-7 h-7 sm:w-10 sm:h-10 text-slate-300" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-slate-400 text-slate-950 font-black text-[10px] font-mono uppercase tracking-wider">
                2nd
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white text-center truncate max-w-full">
              {second.student_name}
            </h4>
            <p className="text-[11px] text-slate-400 text-center truncate max-w-full">
              {second.school_name}
            </p>
            <span className="text-[10px] text-indigo-400 font-semibold mb-2">
              Class {second.student_class}
            </span>

            {/* Pedestal */}
            <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-slate-800/80 to-[#19243A] border-t-2 border-slate-400 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-xl">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-200">
                {second.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Points
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                {second.correct_count} correct
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* 1st Place (Gold) - Elevated in center */}
        {first && (
          <div className="flex flex-col items-center -mt-6">
            <div className="relative mb-3 flex flex-col items-center">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-1 animate-bounce" />
              <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 p-1 shadow-2xl shadow-amber-500/30">
                <div className="w-full h-full bg-[#121A2B] rounded-[22px] flex items-center justify-center">
                  <Trophy className="w-9 h-9 sm:w-12 sm:h-12 text-amber-400" />
                </div>
              </div>
              <span className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-md">
                1st Winner
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-white text-center truncate max-w-full">
              {first.student_name}
            </h4>
            <p className="text-xs text-slate-300 text-center truncate max-w-full font-medium">
              {first.school_name}
            </p>
            <span className="text-[11px] text-amber-400 font-bold mb-2">
              Class {first.student_class}
            </span>

            {/* Gold Pedestal */}
            <div className="w-full h-44 sm:h-56 bg-gradient-to-t from-amber-950/40 via-amber-900/20 to-[#19243A] border-t-4 border-amber-400 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-2xl">
              <span className="text-2xl sm:text-4xl font-black font-mono text-amber-300">
                {first.total_score}
              </span>
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                Points
              </span>
              <span className="text-[11px] text-amber-300/80 font-mono mt-1">
                {first.correct_count} correct • {Math.round(first.total_time_ms / 1000)}s
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-0.5 shadow-lg shadow-amber-900/20">
                <div className="w-full h-full bg-[#121A2B] rounded-[14px] flex items-center justify-center">
                  <Award className="w-7 h-7 sm:w-10 sm:h-10 text-amber-600" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 font-black text-[10px] font-mono uppercase tracking-wider">
                3rd
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white text-center truncate max-w-full">
              {third.student_name}
            </h4>
            <p className="text-[11px] text-slate-400 text-center truncate max-w-full">
              {third.school_name}
            </p>
            <span className="text-[10px] text-indigo-400 font-semibold mb-2">
              Class {third.student_class}
            </span>

            {/* Pedestal */}
            <div className="w-full h-24 sm:h-36 bg-gradient-to-t from-amber-950/20 to-[#19243A] border-t-2 border-amber-700 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-xl">
              <span className="text-lg sm:text-2xl font-black font-mono text-amber-600">
                {third.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Points
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                {third.correct_count} correct
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

