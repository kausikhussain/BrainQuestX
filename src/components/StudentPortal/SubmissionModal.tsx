import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Flag, 
  Clock, 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ExamReviewSummary } from '../../types';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  summary: ExamReviewSummary;
  isSubmitting: boolean;
  roundNumber?: 1 | 2;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  summary,
  isSubmitting,
  roundNumber = 1,
}) => {
  if (!isOpen) return null;

  const hasUnanswered = summary.unansweredCount > 0;
  const hasMarked = summary.markedForReviewCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-soft-lg overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasUnanswered 
                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {hasUnanswered ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Confirm Examination Submission
              </h2>
              <p className="text-xs text-slate-500">
                Round {roundNumber} &bull; Final Attempt Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Unanswered Alert Warning */}
          {hasUnanswered && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-950">
                  Unanswered Questions Remaining!
                </strong>
                <span>
                  You have <strong>{summary.unansweredCount}</strong> unanswered questions out of {summary.totalQuestions}. Since there is no negative marking, attempting every question gives you the best chance to qualify.
                </span>
              </div>
            </div>
          )}

          {/* Marked for Review Alert */}
          {hasMarked && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
              <Flag className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                You currently have <strong>{summary.markedForReviewCount}</strong> questions marked for review. Please ensure you have finalized your answers.
              </span>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Answered</div>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
                {summary.answeredCount}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Unanswered</div>
              <div className={`text-2xl font-extrabold font-mono mt-0.5 ${
                hasUnanswered ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {summary.unansweredCount}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Review Flagged</div>
              <div className="text-2xl font-extrabold text-purple-600 font-mono mt-0.5">
                {summary.markedForReviewCount}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            By confirming submission, your answers will be securely transmitted to the examination evaluation engine. <strong>No further modifications will be permitted.</strong>
          </p>
        </div>

        {/* Modal Actions */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Continue Examination
          </button>

          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Answers...</span>
              </>
            ) : (
              <>
                <span>Confirm & Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

