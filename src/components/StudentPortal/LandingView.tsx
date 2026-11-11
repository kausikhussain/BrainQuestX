import React from 'react';
import { ArrowRight, BookOpen, Code2, Clock, CheckCircle2, Shield, Sparkles, Terminal } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Annual Inter-School Technical Examination
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
          Compete in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300">QUIZMANIA</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          High-performance, synchronized live technical quiz platform designed for Class 11th and 12th students.
          Precision 20-second questions, zero-lag submission, and real-time national leaderboard.
        </p>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {activeStudent ? (
            <button
              onClick={onEnterWaitingRoom}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Waiting Room ({activeStudent.student_name})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStartRegistration}
              disabled={competitionState.status === 'registration_closed'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{competitionState.status === 'registration_closed' ? 'Registration Closed' : 'Register for Competition'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="text-xs text-slate-500 font-mono">
            Class 11 & 12 • No email or phone needed
          </div>
        </div>
      </div>

      {/* Rounds Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Round 1 Card */}
        <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                Round 1
              </span>
              <h3 className="text-lg font-bold text-white">General Paper</h3>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Covers computer architecture, communication hardware, file formats, memory hierarchies, and operating system principles.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#19243A]">
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Questions</div>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">10</div>
            </div>
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Per Question</div>
              <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">20s</div>
            </div>
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Time</div>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">3m 20s</div>
            </div>
          </div>
        </div>

        {/* Round 2 Card */}
        <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                Round 2
              </span>
              <h3 className="text-lg font-bold text-white">Subject Paper (Python)</h3>
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Evaluates Python 3 syntax, identifier rules, list/tuple mutability, string operations, loops, index calculation, and code evaluation.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#19243A]">
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Questions</div>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">10</div>
            </div>
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Per Question</div>
              <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">20s</div>
            </div>
            <div className="bg-[#0B1020] p-2.5 rounded-xl border border-[#22304C]/50 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Time</div>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">3m 20s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Competition Rules & Architecture Callouts */}
      <div className="bg-[#121A2B]/60 border border-[#22304C] rounded-2xl p-6 sm:p-8">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Examination Guidelines & Authoritative Timing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Server-Authoritative Clock:</strong> 20 seconds is enforced strictly on the server. Browser refreshes do not grant extra time.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Instant Locking:</strong> Once an answer is selected and confirmed, it is locked. First submission counts.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Tie-Breaking Rules:</strong> Tied total scores are resolved by Round 2 score, followed by fastest server-recorded response speed.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

