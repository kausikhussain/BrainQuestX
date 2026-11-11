import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, FileText, Award, Clock, ShieldAlert } from 'lucide-react';
import { AttemptAuditReport } from '../../types';
import { competitionService } from '../../services/competitionService';

interface StudentAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string | null;
  studentName?: string;
  adminToken?: string;
}

export const StudentAuditModal: React.FC<StudentAuditModalProps> = ({
  isOpen,
  onClose,
  participantId,
  studentName,
  adminToken,
}) => {
  const [activeRound, setActiveRound] = useState<1 | 2>(1);

  if (!isOpen || !participantId) return null;

  const auditReport: AttemptAuditReport | null = competitionService.getStudentAttemptAudit(
    participantId,
    activeRound,
    adminToken
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white border border-[#E7EAF0] rounded-3xl w-full max-w-3xl shadow-soft-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E7EAF0] flex items-center justify-between bg-[#F8F9FC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#465FE5] bg-[#E9EDFF] border border-[#C5D0FF] px-2.5 py-0.5 rounded-full">
                Candidate Audit Telemetry
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              {auditReport ? auditReport.studentName : (studentName || 'Candidate')} &bull; Score Verification
            </h2>
            {auditReport && (
              <p className="text-xs text-[#647084] mt-0.5">
                {auditReport.schoolName} &bull; Class {auditReport.studentClass}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647084] hover:text-[#172033] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Round Switcher Tabs */}
        <div className="px-6 py-3 border-b border-[#E7EAF0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveRound(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRound === 1
                  ? 'bg-[#465FE5] text-white shadow-soft-sm'
                  : 'text-[#647084] hover:bg-[#F8F9FC] hover:text-[#172033]'
              }`}
            >
              Round 1: General Paper
            </button>
            <button
              onClick={() => setActiveRound(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRound === 2
                  ? 'bg-[#465FE5] text-white shadow-soft-sm'
                  : 'text-[#647084] hover:bg-[#F8F9FC] hover:text-[#172033]'
              }`}
            >
              Round 2: Subject Paper (Python)
            </button>
          </div>

          {auditReport && (
            <div className="text-xs font-mono font-bold text-[#172033]">
              Score: <span className="text-[#465FE5] font-black">{auditReport.obtainedMarks}</span> / {auditReport.maxMarks} ({auditReport.percentage}%)
            </div>
          )}
        </div>

        {/* Modal Body / Audit Breakdown */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F8F9FC]">
          {!auditReport ? (
            <div className="py-12 text-center text-[#8E9BAE]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#465FE5]" />
              <p className="font-bold text-sm text-[#172033]">No attempt record found for Round {activeRound}</p>
              <p className="text-xs text-[#647084] mt-1">The student has not started or submitted this paper.</p>
            </div>
          ) : (
            <>
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAF0] text-center shadow-soft-sm">
                  <span className="text-[10px] uppercase font-bold text-[#647084] font-mono block">Correct</span>
                  <span className="text-xs font-bold font-mono text-[#16845B] mt-0.5 block">
                    {auditReport.correctCount} / {auditReport.questions.length}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAF0] text-center shadow-soft-sm">
                  <span className="text-[10px] uppercase font-bold text-[#647084] font-mono block">Score %</span>
                  <span className="text-xs font-bold font-mono text-[#172033] mt-0.5 block">
                    {auditReport.percentage}%
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAF0] text-center shadow-soft-sm">
                  <span className="text-[10px] uppercase font-bold text-[#647084] font-mono block">Qualification</span>
                  <span className={`text-xs font-bold font-mono mt-0.5 block ${
                    auditReport.isQualified ? 'text-[#16845B]' : 'text-[#647084]'
                  }`}>
                    {auditReport.isQualified ? 'Qualified' : 'Not Qualified'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAF0] text-center shadow-soft-sm">
                  <span className="text-[10px] uppercase font-bold text-[#647084] font-mono block">Fullscreen Exits</span>
                  <span className={`text-xs font-bold font-mono mt-0.5 block ${
                    auditReport.fullscreenExits && auditReport.fullscreenExits.length > 0
                      ? 'text-[#B7791F]'
                      : 'text-[#16845B]'
                  }`}>
                    {auditReport.fullscreenExits ? auditReport.fullscreenExits.length : 0} Exits
                  </span>
                </div>
              </div>

              {/* Fullscreen Exit Telemetry Log */}
              {auditReport.fullscreenExits && auditReport.fullscreenExits.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#FDE68A] shadow-soft-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B7791F] mb-2 flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="w-4 h-4 text-[#B7791F]" />
                    Full-Screen Exit Telemetry Log ({auditReport.fullscreenExits.length})
                  </h4>
                  <div className="space-y-1.5">
                    {auditReport.fullscreenExits.map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-[#647084] p-2 bg-[#FEF3C7]/40 rounded-lg">
                        <span className="font-mono font-bold text-[#B7791F]">Exit Event #{idx + 1}</span>
                        <span className="font-mono text-[11px]">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        <span>
                          {event.returnedAt 
                            ? `Returned: ${new Date(event.returnedAt).toLocaleTimeString()}` 
                            : 'Unreturned'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Per-Question Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#647084] font-mono">
                  Question Response Audit Log
                </h4>

                {auditReport.questions.map((item) => {
                  const isCorrect = item.isCorrect;
                  const isAnswered = item.selectedOptionId !== null;

                  return (
                    <div 
                      key={item.questionId}
                      className={`p-4 rounded-2xl border bg-white shadow-soft-sm ${
                        !isAnswered 
                          ? 'border-[#E7EAF0]' 
                          : isCorrect 
                            ? 'border-[#C8E6C9]' 
                            : 'border-[#FCA5A5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#F8F9FC] text-[#172033] border border-[#E7EAF0]">
                            Q{item.questionNumber}
                          </span>
                          <span className="text-xs font-semibold text-[#172033]">
                            {item.questionText}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {!isAnswered ? (
                            <span className="text-[11px] font-bold text-[#8E9BAE] bg-[#F1F4F9] px-2 py-0.5 rounded font-mono">
                              Unanswered
                            </span>
                          ) : isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16845B] bg-[#E8F5E9] px-2 py-0.5 rounded font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              +{item.marksAwarded} Marks
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C2414A] bg-[#FEE2E2] px-2 py-0.5 rounded font-mono">
                              <XCircle className="w-3 h-3" />
                              0 Marks
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-[#E7EAF0]">
                        <div className="p-2 rounded-lg bg-[#F8F9FC]">
                          <span className="text-[10px] text-[#647084] uppercase font-bold block font-mono">Selected:</span>
                          <span className={`font-medium ${isCorrect ? 'text-[#16845B]' : 'text-[#C2414A]'}`}>
                            {item.selectedOptionLabel ? `(${item.selectedOptionLabel}) ` : ''}{item.selectedOptionText || 'None (Expired / Skipped)'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-[#E8F5E9]/50">
                          <span className="text-[10px] text-[#16845B] uppercase font-bold block font-mono">Answer Key:</span>
                          <span className="font-semibold text-[#16845B]">
                            ({item.correctOptionLabel}) {item.correctOptionText}
                          </span>
                        </div>
                      </div>

                      {/* Official Rationale */}
                      {item.explanation && (
                        <div className="mt-2 text-[11px] text-[#647084] bg-[#F8F9FC] p-2.5 rounded-lg border border-[#E7EAF0]">
                          <strong className="text-[#172033] block mb-0.5">Authoritative Rationale:</strong>
                          <span>{item.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E7EAF0] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#172033] text-white hover:bg-[#232F48] transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
