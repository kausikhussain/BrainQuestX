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
          colors: ['#B7791F', '#465FE5', '#16845B', '#2563EB'],
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
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-0.5 shadow-soft">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Medal className="w-7 h-7 sm:w-9 sm:h-9 text-slate-500" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-extrabold text-[10px] font-mono uppercase tracking-wider border border-slate-300">
                2nd
              </span>
            </div>

            <h4 className="text-xs sm:text-base font-bold text-[#172033] text-center truncate max-w-full">
              {second.student_name}
            </h4>
            <p className="text-[11px] text-[#647084] text-center truncate max-w-full font-medium mb-3">
              {second.school_name} &bull; Cl. {second.student_class || '11th'}
            </p>

            {/* Pedestal */}
            <div className="w-full h-28 sm:h-36 bg-[#F8F9FC] border border-[#E7EAF0] border-t-4 border-t-slate-400 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft-sm">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#172033]">
                {second.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#647084] tracking-wider font-mono">
                Points
              </span>
              <span className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
                {second.correct_count} correct
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* 1st Place (Gold Champion) - Elevated in center */}
        {first && (
          <div className="flex flex-col items-center -mt-6">
            <div className="relative mb-3 flex flex-col items-center">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-[#B7791F] mb-1 animate-bounce" />
              
              <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-3xl bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 p-1 shadow-soft-lg">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center p-1.5 overflow-hidden">
                  <img 
                    src="/achievement-emblem.png" 
                    alt="Gold Champion Emblem"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-[#B7791F]" />
                </div>
              </div>

              <span className="absolute -top-2.5 px-3 py-0.5 rounded-full bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] font-black text-xs font-mono uppercase tracking-wider shadow-sm">
                Champion
              </span>
            </div>

            <h4 className="text-sm sm:text-lg font-black text-[#172033] text-center truncate max-w-full">
              {first.student_name}
            </h4>
            <p className="text-xs text-[#647084] text-center truncate max-w-full font-medium mb-3">
              {first.school_name} &bull; Cl. {first.student_class || '11th'}
            </p>

            {/* Champion Pedestal */}
            <div className="w-full h-36 sm:h-48 bg-[#FEF3C7]/40 border border-[#FDE68A] border-t-4 border-t-[#B7791F] rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft">
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#172033]">
                {first.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#B7791F] tracking-wider font-mono">
                Total Points
              </span>
              <span className="text-[11px] text-[#647084] font-mono font-semibold mt-0.5">
                {first.correct_count} correct ({first.total_pct}%)
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 p-0.5 shadow-soft">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Award className="w-7 h-7 sm:w-9 sm:h-9 text-amber-800" />
                </div>
              </div>
              <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] font-mono uppercase tracking-wider border border-amber-300">
                3rd
              </span>
            </div>

            <h4 className="text-xs sm:text-base font-bold text-[#172033] text-center truncate max-w-full">
              {third.student_name}
            </h4>
            <p className="text-[11px] text-[#647084] text-center truncate max-w-full font-medium mb-3">
              {third.school_name} &bull; Cl. {third.student_class || '11th'}
            </p>

            {/* Pedestal */}
            <div className="w-full h-24 sm:h-28 bg-[#F8F9FC] border border-[#E7EAF0] border-t-4 border-t-amber-800 rounded-t-2xl flex flex-col items-center justify-center p-3 shadow-soft-sm">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#172033]">
                {third.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#647084] tracking-wider font-mono">
                Points
              </span>
              <span className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
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
