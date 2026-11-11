import React, { useEffect } from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Code2, 
  Share2, 
  RotateCcw,
  Medal,
  FileCheck,
  Award,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Participant, StudentExamAttempt, CompetitionState } from '../../types';
import { competitionService } from '../../services/competitionService';

interface ExamResultViewProps {
  participant: Participant;
  attempt: StudentExamAttempt;
  competitionState: CompetitionState;
  onStartRound2: () => void;
  onViewLeaderboard: () => void;
  onReturnToOverview: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  participant,
  attempt,
  competitionState,
  onStartRound2,
  onViewLeaderboard,
  onReturnToOverview,
}) => {
  const isRound1 = attempt.roundNumber === 1;
  const isRound2 = attempt.roundNumber === 2;
  const isQualified = !!attempt.isQualified;
  const score = attempt.score || 0;
  const maxScore = (attempt.totalQuestions || 10) * 10;
  const accuracyPct = Math.round(((attempt.correctCount || 0) / (attempt.totalQuestions || 10)) * 100);

  // Trigger celebration confetti for qualified candidates or round 2 completion
  useEffect(() => {
    if (isQualified || isRound2) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#465FE5', '#16845B', '#B7791F', '#2563EB'],
        });
      } catch {}
    }
  }, [isQualified, isRound2]);

  const formatDuration = (secs?: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const cutoff = competitionService.getQualifyingScore();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn">
      
      {/* Top Completion & Achievement Visual */}
      <div className="text-center mb-8">
        {(isQualified || isRound2) ? (
          <div className="relative w-28 h-28 mx-auto mb-4">
            <img 
              src="/achievement-emblem.png" 
              alt="Achievement Emblem"
              className="w-full h-full object-contain filter drop-shadow-md animate-pulse-glow"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-soft mb-4 bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF]">
            <FileCheck className="w-8 h-8 text-[#465FE5]" />
          </div>
        )}

        {isRound1 ? (
          isQualified ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                Officially Qualified for Round 2
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                Congratulations, {participant.student_name}!
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-1.5 max-w-lg mx-auto">
                You scored above the <strong className="text-[#172033]">{cutoff}% cutoff</strong> and have unlocked <strong>Round 2: Subject Paper (Python)</strong>.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F4F9] text-[#647084] border border-[#E7EAF0] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <FileCheck className="w-3.5 h-3.5 text-[#647084]" />
                Round 1 Completed
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                Thank you for participating, {participant.student_name}!
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-1.5 max-w-lg mx-auto">
                Your examination responses have been evaluated and officially recorded in the championship registry.
              </p>
            </>
          )
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Medal className="w-3.5 h-3.5" />
              Championship Finalized
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
              Round 2 Examination Completed!
            </h1>
            <p className="text-xs sm:text-sm text-[#647084] mt-1.5 max-w-lg mx-auto">
              You have completed both stages of the Inter-School Technical Championship.
            </p>
          </>
        )}
      </div>

      {/* Main Score & Metrics Card */}
      <div className="bg-white border border-[#E7EAF0] rounded-3xl p-6 sm:p-8 shadow-soft mb-8">
        
        {/* Candidate Identity Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E7EAF0] gap-4">
          <div>
            <div className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Candidate Record</div>
            <div className="text-base font-extrabold text-[#172033] mt-0.5">{participant.student_name}</div>
            <div className="text-xs text-[#647084] font-medium flex items-center gap-2 mt-0.5">
              <span>{participant.school_name}</span>
              <span>&bull;</span>
              <span className="font-mono text-[#465FE5] font-semibold">Class {participant.student_class || '11th'}</span>
            </div>
          </div>

          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl px-4 py-2 sm:text-right shrink-0">
            <div className="text-[10px] font-bold text-[#647084] uppercase font-mono">Access Code</div>
            <div className="text-sm font-mono font-black text-[#465FE5] mt-0.5">{participant.access_code}</div>
          </div>
        </div>

        {/* 4 Score Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-[#E7EAF0]">
          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
            <span className="block text-[10px] font-bold text-[#647084] uppercase font-mono">Total Score</span>
            <span className="text-2xl font-black text-[#465FE5] font-mono mt-0.5 block">
              {score} <span className="text-xs text-[#8E9BAE] font-normal">/ {maxScore}</span>
            </span>
          </div>

          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
            <span className="block text-[10px] font-bold text-[#647084] uppercase font-mono">Correct</span>
            <span className="text-2xl font-black text-[#16845B] font-mono mt-0.5 block">
              {attempt.correctCount || 0}
            </span>
          </div>

          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
            <span className="block text-[10px] font-bold text-[#647084] uppercase font-mono">Incorrect</span>
            <span className="text-2xl font-black text-[#C2414A] font-mono mt-0.5 block">
              {attempt.incorrectCount || 0}
            </span>
          </div>

          <div className="bg-[#F8F9FC] border border-[#E7EAF0] rounded-xl p-4 text-center">
            <span className="block text-[10px] font-bold text-[#647084] uppercase font-mono">Time Taken</span>
            <span className="text-2xl font-black text-[#172033] font-mono mt-0.5 block">
              {formatDuration(attempt.timeTakenSeconds)}
            </span>
          </div>
        </div>

        {/* Outcome Guidance Section */}
        {isRound1 && (
          <div className="pt-6">
            {isQualified ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#172033]">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#16845B] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-extrabold text-[#172033] mb-1">
                      Gateway Unlocked: Round 2 (Python Subject Paper)
                    </strong>
                    <p className="text-xs text-[#647084] leading-relaxed mb-4">
                      Your score of <strong className="text-[#172033]">{score}/100</strong> qualifies you for Stage 2. Round 2 tests algorithmic thinking in Python, mutable data structures, syntax comprehension, and snippet tracing.
                    </p>
                    <button
                      onClick={onStartRound2}
                      className="px-6 py-3 rounded-xl font-bold text-xs bg-[#16845B] hover:bg-[#116947] text-white shadow-soft transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Round 2 Examination</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#F8F9FC] border border-[#E7EAF0] text-[#172033]">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E9EDFF] text-[#465FE5] flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-extrabold text-[#172033] mb-1">
                      Performance Summary
                    </strong>
                    <p className="text-xs text-[#647084] leading-relaxed mb-2">
                      You obtained <strong className="text-[#172033]">{score}/100</strong> with an accuracy rate of <strong className="text-[#172033]">{accuracyPct}%</strong>. While this fell below the Round 2 shortlist cutoff of <strong className="text-[#172033]">{cutoff}%</strong>, we commend your competitive participation.
                    </p>
                    <p className="text-xs text-[#8E9BAE]">
                      Your verified result is preserved in the official cross-school records.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isRound2 && (
          <div className="pt-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#E9EDFF] border border-[#C5D0FF] text-[#172033]">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#465FE5] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-sm font-extrabold text-[#172033] mb-1">
                    Both Rounds Successfully Concluded
                  </strong>
                  <p className="text-xs text-[#647084] leading-relaxed">
                    Your scores across the General Paper and Python Subject Paper have been aggregated. Inspect the unified live leaderboard for final school standings and trophy awards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 mt-6 border-t border-[#E7EAF0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onReturnToOverview}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-[#647084] hover:text-[#172033] border border-[#E7EAF0] hover:bg-[#F8F9FC] transition-colors cursor-pointer"
          >
            Back to Candidate Overview
          </button>

          <button
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-[#172033] hover:bg-[#232F48] text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#B7791F]" />
            <span>View Official Leaderboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};
