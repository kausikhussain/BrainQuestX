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
  FileCheck
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
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6'],
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
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn">
      {/* Top Completion Badge */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-soft mb-4 ${
          isQualified || isRound2 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
        }`}>
          {isQualified || isRound2 ? (
            <Trophy className="w-8 h-8 text-emerald-600" />
          ) : (
            <FileCheck className="w-8 h-8 text-indigo-600" />
          )}
        </div>

        {isRound1 ? (
          isQualified ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                Qualified for Round 2
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Congratulations, {participant.student_name}!
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                You have met the qualification criteria for <strong>Round 2: Subject Paper (Python)</strong>.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                Round 1 Completed
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thank you for participating, {participant.student_name}!
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                Your Round 1 responses have been recorded and evaluated by the examination engine.
              </p>
            </>
          )
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Medal className="w-3.5 h-3.5" />
              Competition Finalized
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Round 2 Examination Completed!
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
              You have completed both rounds of the Inter-School Technical Quiz Competition.
            </p>
          </>
        )}
      </div>

      {/* Main Score & Metrics Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Details</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{participant.student_name}</div>
            <div className="text-xs text-slate-600 font-medium">
              {participant.school_name}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 sm:text-right">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Access Code</div>
            <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">{participant.access_code}</div>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase">Total Score</span>
            <span className="text-2xl font-extrabold text-indigo-700 font-mono mt-0.5 block">
              {score} <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase">Correct</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
              {attempt.correctCount || 0}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase">Incorrect</span>
            <span className="text-2xl font-extrabold text-rose-500 font-mono mt-0.5 block">
              {attempt.incorrectCount || 0}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase">Time Taken</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono mt-0.5 block">
              {formatDuration(attempt.timeTakenSeconds)}
            </span>
          </div>
        </div>

        {/* Outcome Guidance Section */}
        {isRound1 && (
          <div className="pt-6">
            {isQualified ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold mb-1">
                      Next Step: Round 2 (Python Subject Paper)
                    </strong>
                    <p className="text-xs text-emerald-900 leading-relaxed mb-4">
                      You achieved a score of <strong>{score}/100</strong>, exceeding the shortlist threshold of <strong>{cutoff}%</strong>. Round 2 covers Python programming, data mutability, execution order, built-in functions, and nested indexing.
                    </p>
                    <button
                      onClick={onStartRound2}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Round 2 Examination</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold mb-1">
                      Round 1 Performance Summary
                    </strong>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      You scored <strong>{score}/100</strong> with an accuracy rate of <strong>{accuracyPct}%</strong>. While this did not reach the Round 2 shortlist cutoff of <strong>{cutoff}%</strong>, we commend your dedication to technical problem-solving.
                    </p>
                    <p className="text-xs text-slate-500">
                      Your performance will be included in the official school examination rankings.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isRound2 && (
          <div className="pt-6">
            <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold mb-1">
                    Both Examination Rounds Successfully Submitted
                  </strong>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Your scores across both General Paper and Python Subject Paper have been aggregated into the central ranking registry. Official final ranks and school honors are available on the live leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onReturnToOverview}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Back to Overview
          </button>

          <button
            onClick={onViewLeaderboard}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>View Official Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

