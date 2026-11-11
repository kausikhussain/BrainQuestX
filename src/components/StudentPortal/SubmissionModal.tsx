import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Flag, 
  Clock, 
  X, 
  ArrowRight,
  ShieldCheck,
  Send
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white border border-[#E7EAF0] rounded-3xl w-full max-w-lg shadow-soft-lg overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E7EAF0] flex items-center justify-between bg-[#F8F9FC]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasUnanswered 
                ? 'bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]' 
                : 'bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9]'
            }`}>
              {hasUnanswered ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172033] tracking-tight">
                Confirm Examination Submission
              </h2>
              <p className="text-xs text-[#647084]">
                Round {roundNumber} &bull; Final Attempt Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#647084] hover:text-[#172033] hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Unanswered Alert Warning */}
          {hasUnanswered && (
            <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B7791F] text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-[#172033]">
                  {summary.unansweredCount} Unanswered Questions
                </strong>
                <span className="text-[#647084] mt-0.5 block">
                  You have {summary.unansweredCount} unanswered questions out of {summary.totalQuestions}. With zero negative marking, each answered question maximizes your score.
                </span>
              </div>
            </div>
          )}

          {/* Review Summary Matrix */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
              <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Answered</span>
              <span className="text-2xl font-black text-[#16845B] font-mono mt-0.5 block">
                {summary.answeredCount}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
              <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Unanswered</span>
              <span className="text-2xl font-black text-[#B7791F] font-mono mt-0.5 block">
                {summary.unansweredCount}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E7EAF0] text-center">
              <span className="text-[10px] uppercase font-bold text-[#647084] block font-mono">Total</span>
              <span className="text-2xl font-black text-[#172033] font-mono mt-0.5 block">
                {summary.totalQuestions}
              </span>
            </div>
          </div>

          <div className="text-xs text-[#647084] leading-relaxed">
            By clicking <strong className="text-[#172033]">Finalize & Submit Attempt</strong>, your responses will be evaluated deterministically under the authoritative marking scheme (+10 points per correct answer).
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 bg-[#F8F9FC] border-t border-[#E7EAF0] flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E7EAF0] text-xs font-bold text-[#647084] hover:bg-white hover:text-[#172033] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Return to Examination
          </button>

          <button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-[#465FE5] hover:bg-[#384EC9] text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Responses...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Finalize & Submit Attempt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
