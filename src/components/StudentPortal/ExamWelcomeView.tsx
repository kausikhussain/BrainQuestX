import React from 'react';
import { 
  UserCheck, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  FileText, 
  ShieldCheck,
  Code2
} from 'lucide-react';
import { CompetitionState, Participant } from '../../types';
import { COMPETITION_ROUNDS } from '../../data/questions';

interface ExamWelcomeViewProps {
  participant: Participant;
  competitionState: CompetitionState;
  onProceedToInstructions: () => void;
  onSwitchSession: () => void;
  isRound2Eligible?: boolean;
  onStartRound2?: () => void;
}

export const ExamWelcomeView: React.FC<ExamWelcomeViewProps> = ({
  participant,
  competitionState,
  onProceedToInstructions,
  onSwitchSession,
  isRound2Eligible = false,
  onStartRound2,
}) => {
  const round1 = COMPETITION_ROUNDS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn">
      {/* Top Breadcrumb & Switch Session */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active Session</span>
          <span>•</span>
          <span className="font-mono text-slate-700">{participant.access_code}</span>
        </div>

        <button
          onClick={onSwitchSession}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch Candidate</span>
        </button>
      </div>

      {/* Candidate Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-soft-sm shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome, {participant.student_name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified Candidate
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 font-medium">
                {participant.school_name}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:text-right shrink-0">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Candidate ID</div>
            <div className="text-base font-mono font-bold text-indigo-700 tracking-wide mt-0.5">
              {participant.access_code}
            </div>
          </div>
        </div>
      </div>

      {/* Examination Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft mb-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              Examination Briefing
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {competitionState.title}
            </h2>
          </div>
        </div>

        {/* Round Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Round 1 Card */}
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                Round 1
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                Ready to Start
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              General Paper
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Computer architecture, communication hardware, file formats, memory hierarchies, and system software.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-indigo-100 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Questions</span>
                <span className="font-bold text-slate-900 font-mono">10</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                <span className="font-bold text-indigo-600 font-mono">10 Mins</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Max Score</span>
                <span className="font-bold text-slate-900 font-mono">100 Pts</span>
              </div>
            </div>
          </div>

          {/* Round 2 Card */}
          <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                Round 2
              </span>
              {isRound2Eligible ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Unlocked (Shortlisted)
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  Shortlist Required
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Subject Paper (Python)
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Python syntax, identifiers, mutability, built-in string/list functions, and control flow mechanics.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Questions</span>
                <span className="font-bold text-slate-900 font-mono">10</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                <span className="font-bold text-slate-700 font-mono">10 Mins</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Max Score</span>
                <span className="font-bold text-slate-900 font-mono">100 Pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Reliability Highlights */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Authoritative timer with refresh resilience</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Instant server answer persistence</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Deterministic real-time evaluation</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Please read the instructions carefully before initiating your examination attempt.
          </p>

          <button
            onClick={onProceedToInstructions}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Read Examination Instructions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

