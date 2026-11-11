import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, FileText, Award, Clock } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-soft-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Official Examination Audit
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {auditReport ? auditReport.studentName : (studentName || 'Candidate')} &bull; Score Verification
            </h2>
            {auditReport && (
              <p className="text-xs text-slate-500 mt-0.5">
                {auditReport.schoolName} &bull; Class {auditReport.studentClass}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Round Switcher Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveRound(1)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRound === 1
                  ? 'bg-indigo-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Round 1: General Paper
            </button>
            <button
              onClick={() => setActiveRound(2)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRound === 2
                  ? 'bg-indigo-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Round 2: Subject Paper (Python)
            </button>
          </div>

          {auditReport && (
            <div className="text-xs font-mono font-bold text-slate-900">
              Score: <span className="text-indigo-600">{auditReport.obtainedMarks}</span> / {auditReport.maxMarks} ({auditReport.percentage}%)
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!auditReport ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No submitted attempt recorded for Round {activeRound}.</p>
            </div>
          ) : (
            <>
              {/* Telemetry Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Correct</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">
                    {auditReport.correctCount}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Incorrect</span>
                  <span className="text-lg font-bold text-rose-600 font-mono mt-0.5 block">
                    {auditReport.incorrectCount}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Unanswered</span>
                  <span className="text-lg font-bold text-slate-600 font-mono mt-0.5 block">
                    {auditReport.unansweredCount}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Fullscreen Exits</span>
                  <span className={`text-lg font-bold font-mono mt-0.5 block ${
                    (auditReport.fullscreenExitCount || 0) > 0 ? 'text-amber-700' : 'text-emerald-600'
                  }`}>
                    {auditReport.fullscreenExitCount || 0}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">Qualification</span>
                  <span className={`text-xs font-bold font-mono mt-1 block ${
                    auditReport.isQualified ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {auditReport.isQualified ? 'QUALIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Full-Screen Exit Log if Exits Occurred */}
              {auditReport.fullscreenExits && auditReport.fullscreenExits.length > 0 && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong className="block font-bold text-amber-950 mb-1">
                    ⚠️ Full-Screen Exit Telemetry Log:
                  </strong>
                  <ul className="space-y-1 list-disc list-inside">
                    {auditReport.fullscreenExits.map((evt, idx) => (
                      <li key={idx} className="font-mono text-[11px]">
                        Exit #{idx + 1}: {new Date(evt.timestamp).toLocaleTimeString()}
                        {evt.returnedAt ? ` → Returned: ${new Date(evt.returnedAt).toLocaleTimeString()}` : ' (Unreturned)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Question-by-Question Evaluation
                </h3>

                {auditReport.questions.map((q) => (
                  <div 
                    key={q.questionId}
                    className={`p-4 rounded-xl border transition-all ${
                      q.isCorrect 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : q.selectedOptionId 
                          ? 'bg-rose-50/40 border-rose-200' 
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          Q{q.questionNumber}
                        </span>
                        {q.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Correct (+{q.marksAwarded} Pts)
                          </span>
                        ) : q.selectedOptionId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                            <XCircle className="w-3.5 h-3.5" />
                            Incorrect (0 Pts)
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            Unanswered (0 Pts)
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-xs font-semibold text-slate-500">
                        Max: {q.maxMarks} Pts
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 mb-3">
                      {q.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                      <div className={`p-2.5 rounded-lg border ${
                        q.isCorrect 
                          ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950 font-medium' 
                          : q.selectedOptionId 
                            ? 'bg-rose-100/60 border-rose-300 text-rose-950 font-medium' 
                            : 'bg-white border-slate-200 text-slate-500 italic'
                      }`}>
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Candidate Choice</span>
                        {q.selectedOptionLabel ? `(${q.selectedOptionLabel}) ${q.selectedOptionText}` : 'Not attempted'}
                      </div>

                      <div className="p-2.5 rounded-lg border bg-emerald-100/60 border-emerald-300 text-emerald-950 font-medium">
                        <span className="block text-[10px] uppercase font-bold text-slate-500">Official Answer Key</span>
                        ({q.correctOptionLabel}) {q.correctOptionText}
                      </div>
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                        <strong>Official Rationale:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};

