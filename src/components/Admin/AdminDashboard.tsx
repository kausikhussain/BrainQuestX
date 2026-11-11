import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  School, 
  Play, 
  Square, 
  SkipForward, 
  RotateCcw, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  ShieldAlert,
  Percent,
  FileCheck
} from 'lucide-react';
import { CompetitionState, Participant, LeaderboardEntry, StudentClass } from '../../types';
import { CLIENT_QUESTIONS } from '../../data/questions';
import { competitionService } from '../../services/competitionService';
import { ResetModal } from './ResetModal';
import { StudentAuditModal } from './StudentAuditModal';

interface AdminDashboardProps {
  competitionState: CompetitionState;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  competitionState,
}) => {
  // Session token state from sessionStorage
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('quizmania_admin_token');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('quizmania_admin_token');
    return competitionService.verifyAdminSession(token);
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Participants & Leaderboard local data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Audit modal state
  const [auditParticipantId, setAuditParticipantId] = useState<string | null>(null);
  const [auditStudentName, setAuditStudentName] = useState<string>('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Qualification cutoff state
  const [qualifyingScore, setQualifyingScore] = useState<number>(() => {
    return competitionService.getQualifyingScore();
  });

  // Load telemetry data
  const refreshData = async () => {
    const parts = competitionService.getAllParticipants();
    setParticipants(parts);
    const lb = await competitionService.getLeaderboard();
    setLeaderboard(lb);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res = await competitionService.loginAdmin(usernameInput, passwordInput);
      if (res.success && res.token) {
        setAdminToken(res.token);
        setIsAuthenticated(true);
        sessionStorage.setItem('quizmania_admin_token', res.token);
        setPasswordInput('');
        refreshData();
      } else {
        setAuthError(res.error || 'Authentication failed. Please verify administrator credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during administrator authentication.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    if (adminToken) {
      competitionService.logoutAdmin(adminToken);
    }
    setAdminToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('quizmania_admin_token');
  };

  const handleUpdateQualifyingCutoff = (newCutoff: number) => {
    setQualifyingScore(newCutoff);
    competitionService.setQualifyingScore(newCutoff, adminToken || undefined);
    refreshData();
  };

  // Metrics
  const totalStudents = participants.length;
  const class11Count = participants.filter((p) => p.student_class === '11th').length;
  const class12Count = participants.filter((p) => p.student_class === '12th').length;
  const uniqueSchools = Array.from(new Set(participants.map((p) => p.school_name)));
  const totalSubmissions = competitionService.getSubmissionsCount();
  const currentQSubmissions = competitionService.getActiveQuestionSubmissionsCount(
    competitionState.current_question_id
  );

  // CSV Export
  const handleExportCSV = () => {
    if (leaderboard.length === 0) return;
    const headers = [
      'Rank',
      'Student Name',
      'School Name',
      'Class',
      'Round 1 Score',
      'Round 2 Score',
      'Total Score',
      'Total Time (ms)',
      'Correct Count',
      'Qualified for Round 2',
      'Access Code',
    ];

    const rows = leaderboard.map((row) => [
      row.rank,
      `"${row.student_name.replace(/"/g, '""')}"`,
      `"${row.school_name.replace(/"/g, '""')}"`,
      row.student_class,
      row.round_1_score,
      row.round_2_score,
      row.total_score,
      row.total_time_ms,
      row.correct_count,
      row.is_qualified ? 'YES' : 'NO',
      participants.find((p) => p.id === row.participant_id)?.access_code || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quizmania_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leaderboard / Participants
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((entry) => {
      const matchesSearch =
        entry.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.school_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSchool =
        selectedSchool === 'all' || entry.school_name === selectedSchool;
      const matchesClass =
        selectedClass === 'all' || entry.student_class === selectedClass;
      return matchesSearch && matchesSchool && matchesClass;
    });
  }, [leaderboard, searchQuery, selectedSchool, selectedClass]);

  // Round questions for jump list
  const currentRoundQuestions = useMemo(() => {
    if (!competitionState.current_round_number) return [];
    return CLIENT_QUESTIONS.filter(
      (q) => q.roundNumber === competitionState.current_round_number
    );
  }, [competitionState.current_round_number]);

  // If not authenticated with a verified administrator session, show secure Administrator Login
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fadeIn">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-soft text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Administrator Sign In</h2>
          <p className="text-xs text-slate-500 mb-6">
            Authorized tournament directors and examination officers only.
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left font-medium animate-fadeIn">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter administrator username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 text-sm outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Password / Secret Key
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter administrator secret"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 text-slate-900 text-sm outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white shadow-soft cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isAuthenticating ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Protected by Server-Authoritative Token Verification &bull; RBAC
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Session Security Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Administrator Session Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                ROLE: ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure examination management console &bull; Token-authenticated audit logging
            </p>
          </div>
        </div>

        <button
          onClick={handleAdminLogout}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          Sign Out of Admin
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Total Students</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalStudents}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Class 11th</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{class11Count}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Class 12th</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{class12Count}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <School className="w-3.5 h-3.5 text-emerald-600" />
            <span>Schools</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{uniqueSchools.length}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Submissions</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalSubmissions}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 font-medium">
            <Percent className="w-3.5 h-3.5 text-purple-600" />
            <span>Shortlist Cutoff</span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono">{qualifyingScore}%</div>
        </div>
      </div>

      {/* Control Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Competition Stage Orchestrator (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Competition Stage Orchestration</h2>
              <p className="text-xs text-slate-500">
                Manage registration lifecycle, synchronized rounds, and question stepper.
              </p>
            </div>
            <span className="text-xs font-mono uppercase font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              State: {competitionState.status}
            </span>
          </div>

          {/* Registration Controls */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-900">Candidate Registration</div>
              <div className="text-xs text-slate-500">Allow or freeze new student registrations.</div>
            </div>
            <button
              onClick={() => {
                const next = competitionState.status === 'registration_open' ? 'registration_closed' : 'registration_open';
                competitionService.setStatus(next);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                competitionState.status === 'registration_open'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {competitionState.status === 'registration_open' ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Open (Accepting)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Closed (Locked)</span>
                </>
              )}
            </button>
          </div>

          {/* Round Starter Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => competitionService.startRound(1)}
              className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-700">
                  Round 1
                </span>
                <Play className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-bold text-slate-900">General Paper</div>
              <div className="text-xs text-slate-500 mt-1">10 Questions &bull; Fundamentals & Hardware</div>
            </button>

            <button
              onClick={() => competitionService.startRound(2)}
              className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-blue-600">
                  Round 2
                </span>
                <Play className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-sm font-bold text-slate-900">Python Subject Paper</div>
              <div className="text-xs text-slate-500 mt-1">10 Questions &bull; Shortlisted Candidates</div>
            </button>
          </div>

          {/* Synchronized Stepper & Auto-Advance */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Question Stepper
                </span>
                <div className="text-xs text-slate-500">
                  {competitionState.current_question_id
                    ? `Currently on Question ${competitionState.current_question_number} (Submissions: ${currentQSubmissions})`
                    : 'No synchronized question currently released.'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => competitionService.advanceNextQuestion()}
                  disabled={competitionState.status !== 'in_progress'}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Next Question</span>
                </button>

                <button
                  onClick={() => competitionService.endRound()}
                  disabled={competitionState.status !== 'in_progress'}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>End Round</span>
                </button>
              </div>
            </div>

            {/* Jump to question pills */}
            {currentRoundQuestions.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Direct Jump:</span>
                {currentRoundQuestions.map((q) => {
                  const isCurrent = q.id === competitionState.current_question_id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => competitionService.releaseQuestion(q.id)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-soft-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {q.questionNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Shortlist Rules & Administration (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-soft space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Qualification & Tools</h2>
            <p className="text-xs text-slate-500">
              Configure shortlist rules, seed rehearsals, and export results.
            </p>
          </div>

          {/* Qualification Cutoff Configurator */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>Round 2 Shortlist Threshold</span>
            </div>
            <p className="text-xs text-purple-950 mb-3">
              Students scoring at or above this percentage qualify for Round 2.
            </p>
            <div className="flex items-center gap-2">
              {[50, 60, 70, 80].map((scoreVal) => (
                <button
                  key={scoreVal}
                  onClick={() => handleUpdateQualifyingCutoff(scoreVal)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    qualifyingScore === scoreVal
                      ? 'bg-purple-600 text-white shadow-soft-sm'
                      : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  {scoreVal}%
                </button>
              ))}
            </div>
          </div>

          {/* Publish Results & CSV Export */}
          <div className="space-y-3">
            <button
              onClick={() => competitionService.publishResults()}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Publish Official Results to Leaderboard</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={leaderboard.length === 0}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Official Results (CSV)</span>
            </button>
          </div>

          {/* Rehearsal Simulation & Reset */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                const count = competitionService.seedMockParticipants(60);
                refreshData();
                alert(`Successfully seeded ${count} mock candidates for rehearsal.`);
              }}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
            >
              + Seed 60 Rehearsal Candidates
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
            >
              Reset Competition
            </button>
          </div>
        </div>
      </div>

      {/* Participants & Live Scores Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Participant Telemetry & Standings</h2>
            <p className="text-xs text-slate-500">
              Live roster with verified student scores, rankings, and qualification flags. Click any student to audit answers.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or school..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="all">All Classes</option>
              <option value="11th">Class 11th</option>
              <option value="12th">Class 12th</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 font-mono text-center">R1 Score</th>
                <th className="py-3 px-4 font-mono text-center">R2 Score</th>
                <th className="py-3 px-4 font-mono text-center">Total</th>
                <th className="py-3 px-4 text-center">Fullscreen Exits</th>
                <th className="py-3 px-4 text-center">Round 2 Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No participants registered or matched your filters.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((row) => {
                  const r1Attempt = competitionService.getActiveExamAttempt(row.participant_id, 1);
                  const r2Attempt = competitionService.getActiveExamAttempt(row.participant_id, 2);
                  const totalExits = (r1Attempt?.fullscreenExitCount || 0) + (r2Attempt?.fullscreenExitCount || 0);

                  return (
                    <tr 
                      key={row.participant_id} 
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => {
                        setAuditParticipantId(row.participant_id);
                        setAuditStudentName(row.student_name);
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        #{row.rank}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {row.student_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {row.school_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Class {row.student_class}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-center text-indigo-700">
                        {row.round_1_score} <span className="text-[10px] text-slate-400 font-normal">/ {row.round_1_max_marks}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-center text-blue-700">
                        {row.round_2_score} <span className="text-[10px] text-slate-400 font-normal">/ {row.round_2_max_marks}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-center text-slate-900">
                        {row.total_score} <span className="text-[10px] text-slate-400 font-normal">({row.total_pct}%)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {totalExits === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            0 Exits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-mono">
                            {totalExits} Exits
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.is_qualified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAuditParticipantId(row.participant_id);
                            setAuditStudentName(row.student_name);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Audit question-by-question scoring"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Attempt Question-by-Question Audit Modal */}
      <StudentAuditModal
        isOpen={!!auditParticipantId}
        onClose={() => setAuditParticipantId(null)}
        participantId={auditParticipantId}
        studentName={auditStudentName}
        adminToken={adminToken || undefined}
      />

      {/* Reset Confirmation Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          competitionService.resetCompetition(adminToken || undefined);
          refreshData();
        }}
      />
    </div>
  );
};
