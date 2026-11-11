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
  FileCheck,
  Zap,
  Lock
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn">
      {/* Top Editorial Pill */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9EDFF] border border-[#C5D0FF] text-[#465FE5] text-xs font-bold uppercase tracking-wider font-mono shadow-soft-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#465FE5]" />
          Annual Inter-School Technical Championship 2026
        </div>
      </div>

      {/* Hero Headline & Subhead */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#172033] leading-[1.1]">
          Academic Excellence, <br />
          <span className="text-[#465FE5]">Proven Under Time.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#647084] leading-relaxed font-normal">
          An ultra-premium inter-school examination platform. Strict 20-second per-question countdowns, 
          server-authoritative evaluation, and real-time deterministic rankings.
        </p>

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          {activeStudent ? (
            <button
              onClick={onEnterWaitingRoom}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-[#465FE5] hover:bg-[#384EC9] text-white shadow-soft transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Resume Candidate Session ({activeStudent.student_name})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStartRegistration}
              disabled={competitionState.status === 'registration_closed'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-[#465FE5] hover:bg-[#384EC9] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-soft transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>{competitionState.status === 'registration_closed' ? 'Registration Closed' : 'Enter Examination Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="text-xs text-[#647084] font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16845B]" />
            <span>Class 11th & 12th &bull; Verified Candidate ID Required</span>
          </div>
        </div>
      </div>

      {/* Hero Visual Composition Card with AI Art */}
      <div className="relative rounded-3xl overflow-hidden border border-[#E7EAF0] shadow-soft-lg mb-12 bg-white group">
        <div className="relative aspect-[21/9] sm:aspect-[2.2/1] w-full bg-[#172033] overflow-hidden">
          <img 
            src="/hero-academic.png" 
            alt="QuizMania Academic Technology Composition"
            className="w-full h-full object-cover object-center opacity-90 group-hover:scale-[1.01] transition-transform duration-700"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/80 via-transparent to-transparent pointer-events-none" />

          {/* Floating Metric Badges over artwork */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-soft flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#465FE5]" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Timed Pace</div>
                <div className="text-xs font-extrabold text-[#172033]">20s Per Question</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-soft flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[#B7791F]" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Anti-Collusion</div>
                <div className="text-xs font-extrabold text-[#172033]">Randomized Sequence</div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/40 shadow-soft flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#16845B]" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Security Gate</div>
                <div className="text-xs font-extrabold text-[#172033]">Full-Screen Telemetry</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Official Examination Rounds Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Round 1 Card */}
        <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 sm:p-7 shadow-soft relative overflow-hidden group hover:border-[#C5D0FF] hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#465FE5] uppercase tracking-wider font-mono">
                  Stage 1 &bull; Screening
                </span>
                <h2 className="text-lg font-bold text-[#172033]">Round 1: General Paper</h2>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9] font-mono">
              100 Marks
            </span>
          </div>

          <p className="text-xs text-[#647084] leading-relaxed mb-5">
            Initial screening paper assessing fundamental computer concepts, communications, hardware, operating systems, and binary mathematics.
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs py-3 px-3 bg-[#F8F9FC] rounded-xl border border-[#E7EAF0] mb-4">
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Questions</span>
              <span className="font-extrabold text-[#172033] font-mono text-sm">10 MCQs</span>
            </div>
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Time Limit</span>
              <span className="font-extrabold text-[#172033] font-mono text-sm">20s / Q</span>
            </div>
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Cutoff</span>
              <span className="font-extrabold text-[#16845B] font-mono text-sm">&ge; 60%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#647084] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16845B] shrink-0" />
            <span>Top candidates with &ge;60% marks qualify for Round 2</span>
          </div>
        </div>

        {/* Round 2 Card */}
        <div className="bg-white border border-[#E7EAF0] rounded-2xl p-6 sm:p-7 shadow-soft relative overflow-hidden group hover:border-[#C5D0FF] hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5]">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#465FE5] uppercase tracking-wider font-mono">
                  Stage 2 &bull; Championship
                </span>
                <h2 className="text-lg font-bold text-[#172033]">Round 2: Subject Paper</h2>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF] font-mono">
              100 Marks
            </span>
          </div>

          <p className="text-xs text-[#647084] leading-relaxed mb-5">
            Advanced technical paper focusing on Python fundamentals, mutable/immutable data structures, loop syntax, slicing, and code output evaluation.
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs py-3 px-3 bg-[#F8F9FC] rounded-xl border border-[#E7EAF0] mb-4">
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Questions</span>
              <span className="font-extrabold text-[#172033] font-mono text-sm">10 MCQs</span>
            </div>
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Time Limit</span>
              <span className="font-extrabold text-[#172033] font-mono text-sm">20s / Q</span>
            </div>
            <div>
              <span className="text-[10px] text-[#647084] uppercase font-semibold block">Focus</span>
              <span className="font-extrabold text-[#465FE5] font-mono text-sm">Python</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#647084] font-medium">
            <Award className="w-3.5 h-3.5 text-[#B7791F] shrink-0" />
            <span>Scores determine the championship podium and final rankings</span>
          </div>
        </div>
      </div>

      {/* Three Pillars of Integrity */}
      <div className="border-t border-[#E7EAF0] pt-10">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#647084] font-mono">
            Platform Guarantees
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-[#E7EAF0] shadow-soft-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#16845B] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">Authoritative Evaluation</h3>
            <p className="text-xs text-[#647084] leading-relaxed">
              All question answers and deadlines are validated with strict deterministic rules on the server.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7EAF0] shadow-soft-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E9EDFF] text-[#465FE5] flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">20s Per-Question Limit</h3>
            <p className="text-xs text-[#647084] leading-relaxed">
              Ensures rapid intellectual reflex and eliminates time to look up answers during competitive trials.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E7EAF0] shadow-soft-sm">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B7791F] flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">Full-Screen Telemetry</h3>
            <p className="text-xs text-[#647084] leading-relaxed">
              Exits from full-screen mode are monitored and timestamped in official examination audit logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
