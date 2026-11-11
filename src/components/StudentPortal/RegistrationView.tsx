import React, { useState } from 'react';
import { User, School, GraduationCap, ArrowRight, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { StudentClass } from '../../types';
import { competitionService } from '../../services/competitionService';

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
      setErrorMsg('Please enter your full name.');
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
        if (res.is_duplicate) {
          setSuccessInfo('Existing registration found! Restoring your session...');
        } else {
          setSuccessInfo('Registration confirmed! Generating access badge...');
        }
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </button>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Participant Registration
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter your name, school, and class to receive your verified participant badge.
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 sm:p-8 shadow-xl">
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Student Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={60}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B1020] border border-[#22304C] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>

          {/* School Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              School / Institution Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <School className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={80}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Delhi Public School, R.K. Puram"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B1020] border border-[#22304C] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-600 text-sm font-medium outline-none transition-all"
              />
            </div>
          </div>

          {/* Class Select: 11th or 12th */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Class / Grade
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStudentClass('11th')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                  studentClass === '11th'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20'
                    : 'bg-[#0B1020] border-[#22304C] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Class 11th</span>
              </button>

              <button
                type="button"
                onClick={() => setStudentClass('12th')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                  studentClass === '12th'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20'
                    : 'bg-[#0B1020] border-[#22304C] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Class 12th</span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-[#0B1020]/60 rounded-xl border border-[#22304C]/40 text-[11px] text-slate-400">
            <strong>Privacy Note:</strong> No email address, telephone number, or password is collected. Your verified participant ID is generated automatically.
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/25 cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Registering...' : 'Confirm Registration & Enter Waiting Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

