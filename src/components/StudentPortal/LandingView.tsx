import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Code2, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Award,
  Users,
  Terminal,
  FileCheck
} from 'lucide-react';
import { CompetitionState, Participant } from '../../types';

interface LandingViewProps {
  competitionState: CompetitionState;
  activeStudent: Participant | null;
  onStartRegistration: () => void;
  onEnterWaitingRoom: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  competitionState,
  activeStudent,
  onStartRegistration,
  onEnterWaitingRoom,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-14 animate-fadeIn">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Annual Inter-School Technical Examination 2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
          Academic Excellence in <span className="text-indigo-600">QUIZMANIA</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          An ultra-premium inter-school technical examination platform. 
          Authoritative timing, interactive question navigation, and real-time qualification analytics.
        </p>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {activeStudent ? (
            <button
              onClick={onEnterWaitingRoom}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Resume Session ({activeStudent.student_name})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStartRegistration}
              disabled={competitionState.status === 'registration_closed'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{competitionState.status === 'registration_closed' ? 'Registration Closed' : 'Enter Examination Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="text-xs text-slate-500 font-medium">
            Inter-School Championship &bull; Verified Candidate Badge Required
          </div>
        </div>
      </div>

      {/* Rounds Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {/* Round 1 Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-soft relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider font-mono">
                Round 1
              </span>
              <h2 className="text-lg font-bold text-slate-900">General Paper</h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Covers computer architecture, communication hardware, file formats, memory hierarchies, binary-to-decimal, and operating systems.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Questions</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">10</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
              <div className="text-base font-bold text-indigo-600 font-mono mt-0.5">10 Mins</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Max Points</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">100</div>
            </div>
          </div>
        </div>

        {/* Round 2 Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-soft relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                Round 2 &bull; Shortlist
              </span>
              <h2 className="text-lg font-bold text-slate-900">Python Subject Paper</h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Evaluates Python language fundamentals, mutability rules, built-in string methods, control structures, and complex list indexing.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Questions</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">10</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
              <div className="text-base font-bold text-blue-600 font-mono mt-0.5">10 Mins</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Max Points</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Architecture Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-6">
          System Architecture & Candidate Safeguards
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Authoritative Clock</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Server-validated examination countdown. Browser refresh or tab closure never alters the remaining deadline.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Zero Answer Leakage</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Correct answer keys and scoring matrices remain isolated on the trusted evaluation engine.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <FileCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Continuous Auto-Save</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Each response is persisted immediately with multi-tier storage resilience and automated final submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
