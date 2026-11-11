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
  Clock,
  Lock
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
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('11th');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = studentName.trim();
    const cleanSchool = schoolName.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name as it appears on your school identification.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorMsg('Student name must contain at least 2 characters.');
      return;
    }
    if (!cleanSchool) {
      setErrorMsg('Please enter your school or educational institution name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await competitionService.registerStudent(cleanName, cleanSchool, studentClass);
      if (res.success) {
        if (res.is_duplicate) {
          setSuccessInfo('Existing candidate profile recognized. Restoring your active session...');
        } else {
          setSuccessInfo('Candidate identity verified. Initializing examination environment...');
        }
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fadeIn">
      {/* Top Back Navigation */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs text-[#647084] hover:text-[#172033] font-medium transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Overview</span>
      </button>

      {/* Main Split-Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[#E7EAF0] shadow-soft-lg overflow-hidden bg-white">
        
        {/* Left Region: Brand Artwork & Editorial Intro (5 cols) */}
        <div className="lg:col-span-5 bg-[#172033] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#465FE5]/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#E9EDFF] text-[11px] font-bold uppercase tracking-wider mb-6 font-mono">
              <Sparkles className="w-3 h-3 text-[#465FE5]" />
              Official Examination Portal
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3 leading-tight">
              Begin Your Championship Attempt
            </h1>

            <p className="text-xs sm:text-sm text-[#D1D7E2] leading-relaxed mb-6">
              Enter your verified candidate credentials to initialize an authoritative session badge. All responses are evaluated under official competitive protocols.
            </p>

            {/* Embedded Visual Asset */}
            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-soft mb-6 aspect-[16/10] bg-slate-900/60 relative">
              <img 
                src="/hero-academic.png" 
                alt="QuizMania Visual Art"
                className="w-full h-full object-cover opacity-85"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172033] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-[11px] font-mono text-white/90 font-medium">
                Round 1 &bull; General Paper
              </div>
            </div>

            {/* Protocol Bullets */}
            <div className="space-y-3 text-xs text-[#D1D7E2]">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#465FE5] shrink-0" />
                <span>Strict 20-Second Active Countdown per Question</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#16845B] shrink-0" />
                <span>Mandatory Full-Screen Mode with Exit Telemetry</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#B7791F] shrink-0" />
                <span>Deterministic Scoring with &ge;60% Round 2 Cutoff</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 text-[11px] text-[#8E9BAE] flex items-center justify-between font-mono">
            <span>CODE: QZ-2026-EXAM</span>
            <span>v2.1 SECURE</span>
          </div>
        </div>

        {/* Right Region: Premium Student Form (7 cols) */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            
            <div className="mb-8">
              <span className="text-[11px] font-bold text-[#465FE5] uppercase tracking-wider font-mono block mb-1">
                Candidate Identification
              </span>
              <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
                Student Sign-In
              </h2>
              <p className="text-xs text-[#647084] mt-1">
                Enter your details exactly as recognized by your institution.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-start gap-3 text-xs text-[#C2414A] animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successInfo && (
              <div className="mb-6 p-4 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-start gap-3 text-xs text-[#16845B] animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successInfo}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                  Full Name <span className="text-[#C2414A]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9BAE]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E7EAF0] bg-white text-sm text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-2 focus:ring-[#465FE5] focus:border-transparent transition-all shadow-soft-sm font-medium"
                  />
                </div>
              </div>

              {/* School Name */}
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                  School / Institution <span className="text-[#C2414A]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9BAE]">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school or college name"
                    autoComplete="organization"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E7EAF0] bg-white text-sm text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-2 focus:ring-[#465FE5] focus:border-transparent transition-all shadow-soft-sm font-medium"
                  />
                </div>
              </div>

              {/* Academic Class Selector (11th or 12th) */}
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                  Academic Class <span className="text-[#C2414A]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStudentClass('11th')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                      studentClass === '11th'
                        ? 'bg-[#E9EDFF] text-[#465FE5] border-[#465FE5] shadow-soft-sm ring-1 ring-[#465FE5]'
                        : 'bg-[#F8F9FC] text-[#647084] border-[#E7EAF0] hover:bg-white hover:text-[#172033]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Class 11th</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentClass('12th')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                      studentClass === '12th'
                        ? 'bg-[#E9EDFF] text-[#465FE5] border-[#465FE5] shadow-soft-sm ring-1 ring-[#465FE5]'
                        : 'bg-[#F8F9FC] text-[#647084] border-[#E7EAF0] hover:bg-white hover:text-[#172033]'
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
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-[#465FE5] hover:bg-[#384EC9] disabled:opacity-50 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Candidate Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Examination Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-[#647084] flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />
                  <span>Session encrypted locally &bull; Zero external trackers</span>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
