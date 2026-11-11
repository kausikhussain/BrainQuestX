import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flag, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  Menu, 
  X, 
  HelpCircle,
  ShieldCheck,
  Check,
  RotateCcw,
  Maximize2,
  ShieldAlert,
  Lock,
  Sparkles
} from 'lucide-react';
import { Participant, Question, StudentExamAttempt, QuestionNavStatus, ExamReviewSummary, QuestionTimerState } from '../../types';
import { competitionService } from '../../services/competitionService';
import { sound } from '../../utils/audio';
import { SubmissionModal } from './SubmissionModal';

interface ExamWorkspaceProps {
  participant: Participant;
  roundNumber?: 1 | 2;
  onFinishExam: (attempt: StudentExamAttempt) => void;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({
  participant,
  roundNumber = 1,
  onFinishExam,
}) => {
  // 1. Initialize or restore authoritative attempt from competition service
  const [attempt, setAttempt] = useState<StudentExamAttempt>(() => {
    return competitionService.startExamAttempt(participant.id, roundNumber);
  });

  // 2. Load questions in student's assigned randomized sequence
  const roundQuestions: Question[] = useMemo(() => {
    return competitionService.getQuestionsForAttempt(participant.id, roundNumber);
  }, [participant.id, roundNumber]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    return attempt.currentQuestionIndex || 0;
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isFullscreenExited, setIsFullscreenExited] = useState(false);

  // Active question in assigned randomized sequence
  const currentQuestion = roundQuestions[currentQuestionIndex] || roundQuestions[0];
  const currentQuestionId = currentQuestion?.id;
  const selectedOptionId = attempt.answers[currentQuestionId] || null;
  const isMarkedForReview = attempt.markedForReviewIds?.includes(currentQuestionId);

  // 3. Active Question 20-Second Countdown Timer
  const [questionTimer, setQuestionTimer] = useState<QuestionTimerState | null>(() => {
    return competitionService.startQuestionTimer(participant.id, roundNumber, currentQuestionIndex);
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const timer = competitionService.startQuestionTimer(participant.id, roundNumber, currentQuestionIndex);
    if (!timer) return 20;
    const now = competitionService.getEstimatedServerTime();
    return Math.max(0, Math.ceil((timer.deadlineTime - now) / 1000));
  });

  // Re-synchronize timer whenever active question changes
  useEffect(() => {
    const timer = competitionService.startQuestionTimer(participant.id, roundNumber, currentQuestionIndex);
    setQuestionTimer(timer);
    if (timer) {
      const now = competitionService.getEstimatedServerTime();
      setSecondsRemaining(Math.max(0, Math.ceil((timer.deadlineTime - now) / 1000)));
    }
  }, [currentQuestionIndex, participant.id, roundNumber]);

  // Execute authoritative submission
  const executeSubmission = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      sound.playSuccess();
      const finalAttempt = await competitionService.submitExamAttempt(participant.id, roundNumber);
      onFinishExam(finalAttempt);
    } catch (err) {
      console.error('Submission failed:', err);
      setIsSubmitting(false);
    }
  }, [isSubmitting, participant.id, roundNumber, onFinishExam]);

  // Automatic question advancement when 20s expires or student confirms
  const handleAutoAdvance = useCallback(async () => {
    if (isSubmitting) return;
    try {
      const res = await competitionService.advanceQuestionAttempt(
        participant.id,
        roundNumber,
        currentQuestionIndex
      );

      if (res.isCompleted) {
        sound.playSuccess();
        onFinishExam(res.attempt);
      } else if (res.nextIndex !== null) {
        setCurrentQuestionIndex(res.nextIndex);
        setAttempt(res.attempt);
      }
    } catch (err) {
      console.error('Error advancing question:', err);
    }
  }, [currentQuestionIndex, isSubmitting, participant.id, roundNumber, onFinishExam]);

  // Authoritative per-question 20-second countdown effect
  useEffect(() => {
    if (!questionTimer || isSubmitting) return;

    let animId: number;
    let expiredTriggered = false;

    const tick = () => {
      const now = competitionService.getEstimatedServerTime();
      const diffMs = questionTimer.deadlineTime - now;

      if (diffMs <= 0) {
        setSecondsRemaining(0);
        if (!expiredTriggered) {
          expiredTriggered = true;
          sound.playTimeExpired();
          // AUTOMATIC QUESTION ADVANCEMENT AT 00:00!
          handleAutoAdvance();
        }
        return;
      }

      const secs = Math.ceil(diffMs / 1000);
      setSecondsRemaining(secs);
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [questionTimer, isSubmitting, handleAutoAdvance]);

  // Full-screen monitoring (Non-blocking: student is never locked out during exam)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreenExited(!isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleReturnToFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Could not re-enter fullscreen:', err);
    }
    setIsFullscreenExited(false);
  };

  // Answer selection handler
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestionId || isSubmitting) return;

    setSaveStatus('saving');
    sound.playSelect();

    const saveRes = competitionService.saveQuestionAnswer(
      participant.id,
      roundNumber,
      currentQuestionId,
      optionId
    );

    if (saveRes.success) {
      setAttempt((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestionId]: optionId,
        },
        visitedQuestionIds: prev.visitedQuestionIds.includes(currentQuestionId)
          ? prev.visitedQuestionIds
          : [...prev.visitedQuestionIds, currentQuestionId],
      }));
    }

    setTimeout(() => {
      setSaveStatus('saved');
    }, 150);
  };

  // Clear answer handler
  const handleClearResponse = () => {
    if (!currentQuestionId || isSubmitting) return;

    setSaveStatus('saving');
    competitionService.clearQuestionAnswer(participant.id, roundNumber, currentQuestionId);

    setAttempt((prev) => {
      const nextAnswers = { ...prev.answers };
      delete nextAnswers[currentQuestionId];
      return {
        ...prev,
        answers: nextAnswers,
      };
    });

    setTimeout(() => {
      setSaveStatus('saved');
    }, 150);
  };

  // Toggle mark for review handler
  const handleToggleMarkForReview = () => {
    if (!currentQuestionId || isSubmitting) return;

    competitionService.toggleMarkForReview(participant.id, roundNumber, currentQuestionId);

    setAttempt((prev) => {
      const idx = prev.markedForReviewIds.indexOf(currentQuestionId);
      const nextMarked = [...prev.markedForReviewIds];
      if (idx >= 0) {
        nextMarked.splice(idx, 1);
      } else {
        nextMarked.push(currentQuestionId);
      }
      return {
        ...prev,
        markedForReviewIds: nextMarked,
      };
    });
  };

  // Manual next question action
  const handleNextClick = () => {
    sound.playSelect();
    handleAutoAdvance();
  };

  // Keyboard shortcuts: A, B, C, D or 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isSubmitModalOpen) return;

      const key = e.key.toUpperCase();
      let optIdx = -1;
      if (key === 'A' || key === '1') optIdx = 0;
      else if (key === 'B' || key === '2') optIdx = 1;
      else if (key === 'C' || key === '3') optIdx = 2;
      else if (key === 'D' || key === '4') optIdx = 3;

      if (optIdx >= 0 && currentQuestion && optIdx < currentQuestion.options.length) {
        handleSelectOption(currentQuestion.options[optIdx].id);
      } else if (e.key === 'Enter') {
        handleNextClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isSubmitting, isSubmitModalOpen, isFullscreenExited, handleNextClick]);

  // Compute question palette status
  const getQuestionNavStatus = (qId: string, idx: number): QuestionNavStatus => {
    const isAnswered = !!attempt.answers[qId];
    const isMarked = attempt.markedForReviewIds?.includes(qId);
    const isCurrent = idx === currentQuestionIndex;
    const isPast = idx < currentQuestionIndex;

    if (isCurrent) return isAnswered ? 'answered' : 'visited_unanswered';
    if (isMarked) return 'marked_for_review';
    if (isAnswered) return 'answered';
    if (isPast) return 'expired';
    return 'not_visited';
  };

  // Summary statistics
  const summary: ExamReviewSummary = useMemo(() => {
    const total = roundQuestions.length;
    let answered = 0;
    roundQuestions.forEach((q) => {
      if (attempt.answers[q.id]) answered++;
    });
    return {
      totalQuestions: total,
      answeredCount: answered,
      unansweredCount: total - answered,
      markedForReviewCount: attempt.markedForReviewIds?.length || 0,
    };
  }, [roundQuestions, attempt.answers, attempt.markedForReviewIds]);

  // Format timer string MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining <= 7 && secondsRemaining > 3;
  const isCriticalTime = secondsRemaining <= 3;
  const roundName = roundNumber === 1 ? 'Round 1: General Paper' : 'Round 2: Subject Paper (Python)';
  const isFinalQuestion = currentQuestionIndex === roundQuestions.length - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* ==================== TOP EXAMINATION HEADER ==================== */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-4 sm:p-5 shadow-soft mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Exam & Candidate Metadata */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5] font-extrabold text-sm shrink-0 font-mono">
              R{roundNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#465FE5] font-mono">
                  {roundName}
                </span>
                <span className="text-[#D1D7E2]">&bull;</span>
                <span className="text-xs font-bold text-[#172033]">
                  {participant.student_name}
                </span>
                <span className="text-[#D1D7E2]">&bull;</span>
                <span className="text-xs text-[#647084] font-medium">
                  {participant.school_name}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-xs text-[#647084]">
                  Progress: <strong className="text-[#172033]">Question {currentQuestionIndex + 1} of {roundQuestions.length}</strong>
                </div>
                
                {/* Micro Save Status Indicator */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#647084] bg-[#F8F9FC] px-2 py-0.5 rounded-full border border-[#E7EAF0]">
                  {saveStatus === 'saved' ? (
                    <>
                      <Check className="w-3 h-3 text-[#16845B]" />
                      <span className="text-[#16845B] font-semibold">Auto-Saved</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3 text-[#B7791F] animate-spin" />
                      <span className="text-[#B7791F] font-semibold">Saving...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header: 20-Second Per-Question Timer & Actions */}
          <div className="flex items-center gap-3 justify-between lg:justify-end">
            
            {/* Authoritative Per-Question Countdown Clock */}
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 transition-all shadow-soft-sm ${
              isCriticalTime 
                ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#C2414A] animate-pulse ring-2 ring-[#C2414A]/20' 
                : isLowTime 
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B7791F]' 
                  : 'bg-[#E9EDFF] border-[#C5D0FF] text-[#465FE5]'
            }`}>
              <Clock className={`w-4 h-4 ${
                isCriticalTime ? 'text-[#C2414A]' : isLowTime ? 'text-[#B7791F]' : 'text-[#465FE5]'
              }`} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">
                  Question Pace
                </span>
                <span className="font-mono text-base sm:text-lg font-black tracking-wider leading-none mt-0.5">
                  {formatTime(secondsRemaining)}
                </span>
              </div>
            </div>

            {/* Mobile Question Palette Toggle */}
            <button
              onClick={() => setIsMobilePaletteOpen(true)}
              className="lg:hidden p-2.5 rounded-xl border border-[#E7EAF0] text-[#172033] hover:bg-[#F8F9FC] flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span>Palette</span>
            </button>

            {/* Submit Examination Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#172033] hover:bg-[#232F48] text-white shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Early</span>
            </button>
          </div>
        </div>

        {/* 20-Second Question Micro Progress Bar */}
        <div className="w-full bg-[#F1F4F9] h-1.5 rounded-full overflow-hidden mt-4">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              isCriticalTime ? 'bg-[#C2414A]' : isLowTime ? 'bg-[#B7791F]' : 'bg-[#465FE5]'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (secondsRemaining / 20) * 100))}%` }}
          />
        </div>
      </div>

      {/* ==================== MAIN WORKSPACE GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* ==================== LEFT / MAIN QUESTION CARD (8 COLS) ==================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 sm:p-8 shadow-soft flex flex-col justify-between min-h-[480px]">
            <div>
              {/* Question Header Metadata */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E7EAF0] mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#465FE5] bg-[#E9EDFF] border border-[#C5D0FF] px-2.5 py-1 rounded-lg">
                    Question {currentQuestionIndex + 1} of {roundQuestions.length}
                  </span>
                  {isMarkedForReview && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]">
                      <Flag className="w-3 h-3 text-[#B7791F]" />
                      Flagged for Review
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#16845B] bg-[#E8F5E9] px-2.5 py-1 rounded-lg border border-[#C8E6C9] font-mono">
                    +{currentQuestion?.points || 10} Marks
                  </span>
                </div>
              </div>

              {/* Question Text & Code Box */}
              <div className="mb-8">
                {currentQuestion && currentQuestion.roundNumber === 2 && (currentQuestion.text.includes('\n') || currentQuestion.text.includes('print')) ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#172033]">
                      Predict the output or behavior of the following Python snippet:
                    </p>
                    <div className="p-4 sm:p-5 rounded-xl bg-[#172033] text-white font-mono text-sm leading-relaxed border border-[#232F48] shadow-soft overflow-x-auto whitespace-pre">
                      <div className="text-[10px] text-[#8E9BAE] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 pb-2 border-b border-white/10">
                        <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                        Python 3 Kernel
                      </div>
                      <code className="text-[#E9EDFF]">{currentQuestion.text}</code>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-lg sm:text-xl font-bold text-[#172033] leading-relaxed whitespace-pre-line">
                    {currentQuestion?.text}
                  </h2>
                )}
              </div>

              {/* 4 Answer Options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const keyShortcut = opt.label;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer group ${
                        isSelected 
                          ? 'bg-[#E9EDFF] border-[#465FE5] ring-2 ring-[#465FE5]/20 shadow-soft-sm' 
                          : 'bg-white border-[#E7EAF0] hover:border-[#C5D0FF] hover:bg-[#F8F9FC]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono transition-colors shrink-0 ${
                          isSelected 
                            ? 'bg-[#465FE5] text-white' 
                            : 'bg-[#F1F4F9] text-[#647084] group-hover:bg-[#E7EAF0] group-hover:text-[#172033]'
                        }`}>
                          {keyShortcut}
                        </span>
                        <span className={`text-sm sm:text-base font-medium transition-colors ${
                          isSelected ? 'text-[#172033] font-bold' : 'text-[#172033]'
                        }`}>
                          {opt.text}
                        </span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'border-[#465FE5] bg-[#465FE5] text-white' 
                          : 'border-[#D1D7E2] bg-white group-hover:border-[#8E9BAE]'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Toolbar */}
            <div className="pt-8 mt-8 border-t border-[#E7EAF0] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Mark for Review Toggle */}
                <button
                  onClick={handleToggleMarkForReview}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isMarkedForReview 
                      ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#B7791F]' 
                      : 'border-[#E7EAF0] text-[#647084] hover:bg-[#F8F9FC] hover:text-[#172033]'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 text-[#B7791F]" />
                  <span>{isMarkedForReview ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>

                {/* Clear Response */}
                {selectedOptionId && (
                  <button
                    onClick={handleClearResponse}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold text-[#C2414A] hover:bg-[#FEE2E2] border border-transparent hover:border-[#FCA5A5] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>

              {/* Confirm & Next Button (Advances Immediately) */}
              <button
                onClick={handleNextClick}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#465FE5] hover:bg-[#384EC9] text-white shadow-soft transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isFinalQuestion ? 'Confirm & Finalize Exam' : 'Confirm & Next Question'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT / QUESTION PALETTE (4 COLS) ==================== */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 shadow-soft sticky top-24">
            <h3 className="text-sm font-bold text-[#172033] pb-3 border-b border-[#E7EAF0] mb-4 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs font-mono font-semibold text-[#647084]">
                10 Questions &bull; 20s Each
              </span>
            </h3>

            {/* 10-Question Grid */}
            <div className="grid grid-cols-5 gap-2.5 mb-6">
              {roundQuestions.map((q, idx) => {
                const status = getQuestionNavStatus(q.id, idx);
                const isCurrent = idx === currentQuestionIndex;

                let btnStyle = 'border-[#E7EAF0] text-[#8E9BAE] bg-white cursor-default';
                if (isCurrent) {
                  btnStyle = 'bg-[#465FE5] border-[#465FE5] text-white font-extrabold ring-2 ring-[#465FE5] ring-offset-2';
                } else if (status === 'answered') {
                  btnStyle = 'bg-[#16845B] border-[#16845B] text-white font-bold';
                } else if (status === 'expired') {
                  btnStyle = 'bg-[#FEF3C7] border-[#FDE68A] text-[#B7791F] font-semibold';
                }

                return (
                  <div
                    key={q.id}
                    className={`h-11 rounded-xl border flex items-center justify-center font-mono text-xs font-bold transition-all relative ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {idx < currentQuestionIndex && (
                      <Lock className="w-2.5 h-2.5 absolute top-1 right-1 opacity-70" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Palette Status Legend */}
            <div className="pt-4 border-t border-[#E7EAF0] space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-[#647084]">
                <span className="w-4 h-4 rounded-md bg-[#465FE5] flex items-center justify-center text-white text-[10px] font-bold">
                  ●
                </span>
                <span>Active Question</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#647084]">
                <span className="w-4 h-4 rounded-md bg-[#16845B] flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </span>
                <span>Answered ({summary.answeredCount})</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#647084]">
                <span className="w-4 h-4 rounded-md bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B7791F] text-[10px] font-bold">
                  ✕
                </span>
                <span>Expired / Skipped ({summary.unansweredCount})</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#647084]">
                <span className="w-4 h-4 rounded-md bg-white border border-[#E7EAF0]" />
                <span>Upcoming Questions</span>
              </div>
            </div>

            {/* Early Submission CTA */}
            <div className="pt-5 mt-5 border-t border-[#E7EAF0]">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#172033] hover:bg-[#232F48] text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Finalize Examination</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE PALETTE BOTTOM SHEET ==================== */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#172033]/60 backdrop-blur-xs lg:hidden">
          <div className="bg-white rounded-t-3xl p-6 shadow-soft-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF0] mb-4">
              <h3 className="font-bold text-sm text-[#172033]">Question Palette</h3>
              <button 
                onClick={() => setIsMobilePaletteOpen(false)}
                className="p-1 rounded-lg text-[#647084] hover:bg-[#F8F9FC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {roundQuestions.map((q, idx) => {
                const status = getQuestionNavStatus(q.id, idx);
                const isCurrent = idx === currentQuestionIndex;

                let btnStyle = 'border-[#E7EAF0] text-[#8E9BAE] bg-white';
                if (isCurrent) {
                  btnStyle = 'bg-[#465FE5] border-[#465FE5] text-white font-bold ring-2 ring-[#465FE5]';
                } else if (status === 'answered') {
                  btnStyle = 'bg-[#16845B] border-[#16845B] text-white font-bold';
                } else if (status === 'expired') {
                  btnStyle = 'bg-[#FEF3C7] border-[#FDE68A] text-[#B7791F] font-semibold';
                }

                return (
                  <div
                    key={q.id}
                    className={`h-12 rounded-xl border flex items-center justify-center font-mono text-sm font-bold relative ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {idx < currentQuestionIndex && (
                      <Lock className="w-2.5 h-2.5 absolute top-1 right-1 opacity-70" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsMobilePaletteOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="w-full py-3 rounded-xl font-bold text-xs bg-[#172033] text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Finalize Examination</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== SUBMISSION CONFIRMATION MODAL ==================== */}
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={executeSubmission}
        summary={summary}
        isSubmitting={isSubmitting}
        roundNumber={roundNumber}
      />
    </div>
  );
};
