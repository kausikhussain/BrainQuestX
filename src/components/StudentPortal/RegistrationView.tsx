import React, { useState } from 'react';
import { 
  User, 
  School, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Award,
  GraduationCap,
  Key
} from 'lucide-react';
import { competitionService } from '../../services/competitionService';
import { StudentClass } from '../../types';

interface RegistrationViewProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<'register' | 'recover'>('register');
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('11th');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'recover') {
      const cleanCode = accessCode.trim().toUpperCase();
      if (!cleanCode) {
        setErrorMsg('Please enter your assigned Access Code.');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await competitionService.loginWithAccessCode(cleanCode);
        if (res.success) {
          setSuccessInfo('Access code verified! Restoring your examination session...');
          setTimeout(() => {
            onSuccess();
          }, 700);
        } else {
          setErrorMsg(res.error || 'Invalid Access Code. Please check and try again.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An unexpected error occurred during authentication.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const cleanName = studentName.trim();
    const cleanSchool = schoolName.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name as it appears on your school ID.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorMsg('Student name must be at least 2 characters.');
      return;
    }
    if (!cleanSchool) {
      setErrorMsg('Please enter your school or institution name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await competitionService.registerStudent(cleanName, cleanSchool, studentClass);
      if (res.success) {
        setSuccessInfo('Candidate verification confirmed! Preparing your examination briefing...');
        setTimeout(() => {
          onSuccess();
        }, 700);
      } else {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
        if (res.is_duplicate) {
          setMode('recover');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fadeIn">
      {/* Top Back Navigation */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Competition Overview</span>
      </button>

      {/* Main Composition Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Brand & Academic Overview (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-soft">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-6 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Annual Inter-School Contest
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
              Candidate Examination Portal
            </h1>

            <p className="text-sm text-indigo-100/80 leading-relaxed mb-6">
              Enter your verified details to initialize your official session badge. Your responses will be evaluated deterministically under server-authoritative rules.
            </p>

            <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-white">Round 1: General Paper</strong>
                  <span className="text-indigo-200/70">10 Questions &bull; 100 Maximum Points</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-white">Round 2: Subject Paper</strong>
                  <span className="text-indigo-200/70">Python Programming (Shortlisted Candidates)</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-white">Academic Integrity & Privacy</strong>
                  <span className="text-indigo-200/70">No personal email or phone data stored</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-indigo-300/70 font-mono">
            Inter-School Technical Assessment &bull; Unified Championship Roster
          </div>
        </div>

        {/* Right Side: Information Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'register' ? 'Candidate Information' : 'Resume Existing Session'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === 'register' 
                  ? 'Please provide your formal student name and school for the examination roster.'
                  : 'Enter your assigned secret Access Code to resume your examination session.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-soft-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                New Registration
              </button>
              <button
                type="button"
                onClick={() => { setMode('recover'); setErrorMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'recover' ? 'bg-white text-slate-900 shadow-soft-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Authenticate with Access Code
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successInfo && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successInfo}</span>
              </div>
            )}

            {mode === 'recover' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Assigned Access Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QZ-A891BC"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-mono font-bold tracking-wider uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Enter the 6-character access code issued to you during initial registration.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <span>Authenticate & Resume Session</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Student Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter formal student full name"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* School Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  School / Institution Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter official school or institution name"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Academic Class Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Academic Class <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStudentClass('11th')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      studentClass === '11th'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20 shadow-soft-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Class 11th</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentClass('12th')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      studentClass === '12th'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20 shadow-soft-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Class 12th</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Verifying Candidate Records...</span>
                  ) : (
                    <>
                      <span>Continue to Examination</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Server-Authoritative Evaluation</span>
            <span>Deterministic Scoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};
