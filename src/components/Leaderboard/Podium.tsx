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
          colors: ['#F59E0B', '#4F46E5', '#10B981', '#3B82F6'],
        });
      } catch {}
    }
  }, [isResultsPublished, first]);

  if (!first) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end justify-center">
        {/* 2nd Place (Silver) */}
        {second ? (
          <div className="flex flex-col items-center">
            {/* Avatar Badge */}
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-0.5 shadow-soft">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Medal className="w-7 h-7 sm:w-10 sm:h-10 text-slate-500" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-extrabold text-[10px] font-mono uppercase tracking-wider">
                2nd
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 text-center truncate max-w-full">
              {second.student_name}
            </h4>
            <p className="text-[11px] text-slate-500 text-center truncate max-w-full font-medium mb-3">
              {second.school_name}
            </p>

            {/* Pedestal */}
            <div className="w-full h-28 sm:h-36 bg-slate-100 border-t-4 border-slate-300 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft-sm">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {second.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Points
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
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
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-1 animate-bounce" />
              <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-1 shadow-soft-lg">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
                  <Trophy className="w-9 h-9 sm:w-12 sm:h-12 text-amber-500" />
                </div>
              </div>
              <span className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs font-mono uppercase tracking-wider shadow-sm">
                Champion
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 text-center truncate max-w-full">
              {first.student_name}
            </h4>
            <p className="text-xs text-slate-600 text-center truncate max-w-full font-medium mb-3">
              {first.school_name}
            </p>

            {/* Pedestal */}
            <div className="w-full h-36 sm:h-48 bg-amber-50 border-t-4 border-amber-400 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-950">
                {first.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                Total Points
              </span>
              <span className="text-[11px] text-amber-700 font-mono font-semibold mt-0.5">
                {first.correct_count} correct
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third ? (
          <div className="flex flex-col items-center">
            {/* Avatar Badge */}
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 p-0.5 shadow-soft">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Award className="w-7 h-7 sm:w-10 sm:h-10 text-amber-700" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] font-mono uppercase tracking-wider">
                3rd
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 text-center truncate max-w-full">
              {third.student_name}
            </h4>
            <p className="text-[11px] text-slate-500 text-center truncate max-w-full font-medium mb-3">
              {third.school_name}
            </p>

            {/* Pedestal */}
            <div className="w-full h-24 sm:h-28 bg-slate-100 border-t-4 border-amber-600 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft-sm">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {third.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Points
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
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
