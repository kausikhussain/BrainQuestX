import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Wifi, 
  Send, 
  Lock,
  ChevronRight,
  Code
} from 'lucide-react';
import { CompetitionState, Participant, Question, SubmissionResult } from '../../types';
import { CLIENT_QUESTIONS } from '../../data/questions';
import { competitionService } from '../../services/competitionService';
import { Timer } from '../Timer';

interface QuizInterfaceProps {
  participant: Participant;
  competitionState: CompetitionState;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  participant,
  competitionState,
}) => {
  const currentQuestionId = competitionState.current_question_id;
  const currentQuestion = CLIENT_QUESTIONS.find((q) => q.id === currentQuestionId);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<'idle' | 'pending' | 'accepted' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Check if student already submitted when question changes or on mount
  useEffect(() => {
    if (!currentQuestionId) return;

    // Reset state for new question
    const alreadyDone = competitionService.hasSubmitted(participant.id, currentQuestionId);
    if (alreadyDone) {
      setIsLocked(true);
      setSubmissionState('accepted');
    } else {
      setSelectedOptionId(null);
      setSubmissionState('idle');
      setErrorMessage(null);
      setIsLocked(false);
    }
  }, [currentQuestionId, participant.id]);

  // Handle Option Click & Submit
  const handleSelectOption = useCallback(async (optionId: string) => {
    if (isLocked || submissionState === 'pending' || !currentQuestionId) return;

    setSelectedOptionId(optionId);
    setIsLocked(true);
    setSubmissionState('pending');
    setErrorMessage(null);

    try {
      const res: SubmissionResult = await competitionService.submitAnswer(
        participant.id,
        currentQuestionId,
        optionId
      );

      if (res.success) {
        setSubmissionState('accepted');
      } else {
        setSubmissionState('failed');
        setErrorMessage(res.error || 'Submission could not be verified.');
      }
    } catch (err: any) {
      setSubmissionState('failed');
      setErrorMessage(err.message || 'Network interruption. Click to retry.');
    }
  }, [isLocked, submissionState, currentQuestionId, participant.id]);

  // Keyboard navigation shortcuts: A, B, C, D or 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked || !currentQuestion) return;

      const key = e.key.toUpperCase();
      let optIndex = -1;
      if (key === 'A' || key === '1') optIndex = 0;
      else if (key === 'B' || key === '2') optIndex = 1;
      else if (key === 'C' || key === '3') optIndex = 2;
      else if (key === 'D' || key === '4') optIndex = 3;

      if (optIndex >= 0 && optIndex < currentQuestion.options.length) {
        handleSelectOption(currentQuestion.options[optIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, currentQuestion, handleSelectOption]);

  // Handle Timer Expiry
  const handleTimerExpire = () => {
    if (!isLocked) {
      setIsLocked(true);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Synchronizing Next Question</h3>
        <p className="text-xs text-slate-400">
          The server is preparing the next question. Please remain on this screen.
        </p>
      </div>
    );
  }

  // Detect if question contains code snippet (e.g. Python code questions)
  const isCodeQuestion = currentQuestion.text.includes('\n') || 
                         currentQuestion.text.includes('print(') || 
                         currentQuestion.text.includes('range(') ||
                         currentQuestion.text.includes('Li =');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Header Card */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-4 sm:p-5 mb-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Round {currentQuestion.roundNumber}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {currentQuestion.roundNumber === 1 ? 'General Paper' : 'Subject Paper (Python)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 font-mono">
              Q{currentQuestion.questionNumber} of 10
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Server Authoritative Clock Active" />
          </div>
        </div>

        {/* 20s Authoritative Timer */}
        <Timer
          deadline={competitionState.question_deadline}
          totalDurationSeconds={competitionState.duration_per_question || 20}
          onExpire={handleTimerExpire}
          isLocked={isLocked && submissionState === 'accepted'}
        />
      </div>

      {/* Question Card */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
            Question #{currentQuestion.questionNumber} • {currentQuestion.points} Points
          </span>

          <span className="text-[10px] uppercase font-semibold text-slate-500 font-mono">
            ID: {currentQuestion.id}
          </span>
        </div>

        {/* Question Text */}
        {isCodeQuestion ? (
          <div className="space-y-3">
            <div className="text-base sm:text-lg font-bold text-slate-100">
              {currentQuestion.text.split('\n')[0]}
            </div>
            <div className="bg-[#0B1020] border border-[#22304C] rounded-xl p-4 font-mono text-sm text-cyan-300 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 border-b border-slate-800 pb-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Python 3 Code</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                {currentQuestion.text.split('\n').slice(1).join('\n')}
              </pre>
            </div>
          </div>
        ) : (
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
            {currentQuestion.text}
          </h2>
        )}
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionId === option.id;

          let optionStyle = 'bg-[#121A2B] border-[#22304C] hover:border-indigo-500/60 hover:bg-[#162136]';
          let badgeStyle = 'bg-[#0B1020] text-slate-400 border-[#22304C]';

          if (isSelected) {
            optionStyle = 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500';
            badgeStyle = 'bg-indigo-600 text-white border-indigo-400';
          } else if (isLocked) {
            optionStyle = 'bg-[#121A2B]/40 border-slate-800/60 opacity-60 cursor-not-allowed';
            badgeStyle = 'bg-slate-900 text-slate-600 border-slate-800';
          }

          return (
            <button
              key={option.id}
              disabled={isLocked}
              onClick={() => handleSelectOption(option.id)}
              className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${optionStyle}`}
            >
              <div className={`w-8 h-8 rounded-lg border font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}>
                {option.label}
              </div>

              <div className="flex-1 pt-1">
                <span className={`text-sm font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-200'}`}>
                  {option.text}
                </span>
              </div>

              {isSelected && (
                <div className="pt-1 text-indigo-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submission Status Bar */}
      <div className="bg-[#0B1020] border border-[#22304C] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {submissionState === 'accepted' && (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">
                Answer submitted and securely recorded on server.
              </span>
            </>
          )}

          {submissionState === 'pending' && (
            <>
              <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-xs text-indigo-300 font-semibold">
                Transmitting response to authoritative server...
              </span>
            </>
          )}

          {submissionState === 'failed' && (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-rose-400 font-semibold">
                {errorMessage || 'Submission failed.'}
              </span>
            </>
          )}

          {submissionState === 'idle' && (
            <>
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">
                Click any option card or press keys (A, B, C, D) to submit.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Candidate: {participant.access_code}</span>
        </div>
      </div>
    </div>
  );
};

