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
  FileCheck,
  ShieldCheck,
  LogOut,
  Zap
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
  // Session token state from sessionStorage or localStorage
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('quizmania_admin_token') || localStorage.getItem('quizmania_admin_session_token');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('quizmania_admin_token') || localStorage.getItem('quizmania_admin_session_token');
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
        try {
          localStorage.setItem('quizmania_admin_session_token', res.token);
        } catch {}
        setPasswordInput('');
        refreshData();
      } else {
        setAuthError(res.error || 'Authentication failed. Please verify administrator credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    if (adminToken) {
      competitionService.logoutAdmin(adminToken);
    }
    sessionStorage.removeItem('quizmania_admin_token');
    try {
      localStorage.removeItem('quizmania_admin_session_token');
    } catch {}
    setAdminToken(null);
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleToggleRegistration = () => {
    const nextStatus = competitionState.status === 'registration_open' ? 'registration_closed' : 'registration_open';
    competitionService.setStatus(nextStatus);
  };

  const handlePublishResults = () => {
    competitionService.setStatus('results_published');
  };

  const handleSetCutoff = (score: number) => {
    competitionService.setQualifyingScore(score, adminToken || undefined);
    setQualifyingScore(score);
    refreshData();
  };

  const handleSeedRehearsal = async () => {
    const schools = [
      'Delhi Public School',
      'Modern High School',
      'St. Xavier Collegiate School',
      'Bishop Cotton Boys School',
      'National Public School',
      'Bombay Scottish School'
    ];
    const classes: StudentClass[] = ['11th', '12th'];

    for (let i = 1; i <= 60; i++) {
      const name = `Rehearsal Candidate ${i}`;
      const school = schools[i % schools.length];
      const cls = classes[i % 2];
      await competitionService.registerStudent(name, school, cls);
    }
    refreshData();
  };

  const handleExportCSV = async () => {
    const csvContent = await competitionService.exportResultsCSV(adminToken || undefined);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quizmania_official_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct schools
  const uniqueSchools = useMemo(() => {
    return Array.from(new Set(participants.map((p) => p.school_name)));
  }, [participants]);

  // Filtered leaderboard table
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((entry) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        entry.student_name.toLowerCase().includes(q) || 
        entry.school_name.toLowerCase().includes(q);
      const matchesSchool = selectedSchool === 'all' || entry.school_name === selectedSchool;
      const matchesClass = selectedClass === 'all' || entry.student_class === selectedClass;
      return matchesSearch && matchesSchool && matchesClass;
    });
  }, [leaderboard, searchQuery, selectedSchool, selectedClass]);

  // Aggregate Metrics
  const totalRegistered = participants.length;
  const totalSubmissions = leaderboard.length;
  const qualifiedCount = leaderboard.filter((e) => e.is_qualified).length;
  const round2Count = leaderboard.filter((e) => e.round_2_score !== undefined).length;
  const avgScore = leaderboard.length > 0
    ? Math.round((leaderboard.reduce((acc, curr) => acc + curr.total_score, 0) / leaderboard.length) * 10) / 10
    : 0;

  // ==================== UNINITIALIZED / LOGIN STATE ====================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fadeIn">
        <div className="bg-white border border-[#E7EAF0] rounded-3xl p-8 shadow-soft-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#E9EDFF] border border-[#C5D0FF] flex items-center justify-center text-[#465FE5] mx-auto mb-5 shadow-soft-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center mb-8">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#465FE5] bg-[#E9EDFF] border border-[#C5D0FF] px-2.5 py-1 rounded-full inline-block mb-2">
              Privileged Access
            </span>
            <h1 className="text-2xl font-black text-[#172033] tracking-tight">
              Administrator Console
            </h1>
            <p className="text-xs text-[#647084] mt-1">
              Sign in with verified institutional credentials to access live candidate controls and telemetry.
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] flex items-start gap-3 text-xs text-[#C2414A] animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5 font-mono">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter administrator username"
                className="w-full px-4 py-3 rounded-xl border border-[#E7EAF0] bg-white text-xs text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-2 focus:ring-[#465FE5] shadow-soft-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5 font-mono">
                Security Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full px-4 py-3 rounded-xl border border-[#E7EAF0] bg-white text-xs text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-2 focus:ring-[#465FE5] shadow-soft-sm font-medium"
              />
              <p className="text-[11px] text-[#8E9BAE] mt-1.5 flex items-center justify-between">
                <span>Authorized institutional officers &amp; tournament directors only.</span>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-xs bg-[#172033] hover:bg-[#232F48] disabled:opacity-50 text-white shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Admin Session...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#465FE5]" />
                    <span>Unlock Administration Console</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-3">
              <p className="text-[11px] text-[#8E9BAE] flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Protected by 5-failure brute-force defense lockout</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==================== AUTHENTICATED ADMIN DASHBOARD ====================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 animate-fadeIn">
      
      {/* Top Admin Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7EAF0] mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#16845B] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Session Active
            </span>
            {competitionService.getCloudBackendStatus().isConfigured ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#465FE5] bg-[#E9EDFF] border border-[#C5D0FF] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#465FE5] animate-pulse" />
                Cloud Synchronized
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#647084] bg-[#F1F4F9] border border-[#E7EAF0] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                Resilient Standalone Mode
              </span>
            )}
            <span className="text-xs text-[#8E9BAE] font-mono">
              Token: {adminToken?.slice(0, 16)}...
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
            Examination Administration Console
          </h1>
          <p className="text-xs sm:text-sm text-[#647084] mt-0.5">
            Real-time candidate telemetry, live cut-off controls, and full-screen compliance audit.
          </p>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E7EAF0] bg-white hover:bg-[#F8F9FC] text-[#172033] shadow-soft-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#465FE5]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSeedRehearsal}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#C5D0FF] bg-[#E9EDFF] hover:bg-[#D9E2FF] text-[#465FE5] shadow-soft-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+ Seed 60 Candidates</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#FCA5A5] bg-[#FEE2E2] hover:bg-[#FECACA] text-[#C2414A] shadow-soft-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Competition</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E7EAF0] bg-white hover:bg-[#F8F9FC] text-[#647084] hover:text-[#172033] transition-colors flex items-center gap-1 cursor-pointer"
            title="Sign Out of Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* 5 Key Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7EAF0] shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">Registered</div>
          <div className="text-2xl font-black text-[#172033] font-mono mt-1">{totalRegistered}</div>
          <div className="text-[11px] text-[#8E9BAE] mt-0.5">Enrolled candidates</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7EAF0] shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">Submissions</div>
          <div className="text-2xl font-black text-[#465FE5] font-mono mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-[#8E9BAE] mt-0.5">Completed attempts</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7EAF0] shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">Qualified (R2)</div>
          <div className="text-2xl font-black text-[#16845B] font-mono mt-1">{qualifiedCount}</div>
          <div className="text-[11px] text-[#8E9BAE] mt-0.5">&ge; {qualifyingScore}% cutoff</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7EAF0] shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">Round 2 Attempted</div>
          <div className="text-2xl font-black text-[#B7791F] font-mono mt-1">{round2Count}</div>
          <div className="text-[11px] text-[#8E9BAE] mt-0.5">Subject Paper (Python)</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7EAF0] shadow-soft col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#647084] font-mono">Average Score</div>
          <div className="text-2xl font-black text-[#172033] font-mono mt-1">{avgScore}</div>
          <div className="text-[11px] text-[#8E9BAE] mt-0.5">Points per candidate</div>
        </div>
      </div>

      {/* Control Strip: Registration Toggle & Cutoff Configuration */}
      <div className="bg-white border border-[#E7EAF0] rounded-2xl p-5 shadow-soft mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Registration Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#172033]">Candidate Registration Portal</span>
            <span className="text-[11px] text-[#647084]">
              {competitionState.status === 'registration_open' ? 'Students can register and begin.' : 'Registration is currently locked.'}
            </span>
          </div>

          <button
            onClick={handleToggleRegistration}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              competitionState.status === 'registration_open'
                ? 'bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9]'
                : 'bg-[#F1F4F9] text-[#647084] border border-[#E7EAF0]'
            }`}
          >
            {competitionState.status === 'registration_open' ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#16845B]" />
                <span>Open (Accepting)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-[#647084]" />
                <span>Closed (Locked)</span>
              </>
            )}
          </button>
        </div>

        {/* Shortlist Qualifying Cutoff Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#172033] font-mono">
            R2 Cutoff Threshold:
          </span>
          <div className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E7EAF0] p-1 rounded-xl">
            {[50, 60, 70, 80].map((cutoff) => (
              <button
                key={cutoff}
                onClick={() => handleSetCutoff(cutoff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  qualifyingScore === cutoff
                    ? 'bg-[#465FE5] text-white shadow-soft-sm'
                    : 'text-[#647084] hover:text-[#172033]'
                }`}
              >
                {cutoff}%
              </button>
            ))}
          </div>
        </div>

        {/* Publish Results Button */}
        <div>
          <button
            onClick={handlePublishResults}
            disabled={competitionState.status === 'results_published'}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-[#172033] hover:bg-[#232F48] disabled:opacity-50 text-white shadow-soft transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#B7791F]" />
            <span>{competitionState.status === 'results_published' ? 'Standings Published' : 'Publish Official Standings'}</span>
          </button>
        </div>
      </div>

      {/* Candidate Records Table Card */}
      <div className="bg-white border border-[#E7EAF0] rounded-3xl shadow-soft overflow-hidden">
        
        {/* Table Filter Toolbar */}
        <div className="p-5 border-b border-[#E7EAF0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#172033]">
              Candidate Examination Roster
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F1F4F9] text-[#647084]">
              {filteredLeaderboard.length} Candidates
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E7EAF0] text-xs text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-1 focus:ring-[#465FE5]"
              />
            </div>

            {/* School Filter */}
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E7EAF0] text-xs text-[#172033] bg-white focus:outline-none focus:ring-1 focus:ring-[#465FE5]"
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E7EAF0] text-xs text-[#172033] bg-white focus:outline-none focus:ring-1 focus:ring-[#465FE5]"
            >
              <option value="all">All Classes</option>
              <option value="11th">Class 11th</option>
              <option value="12th">Class 12th</option>
            </select>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8F9FC] text-[10px] uppercase font-bold text-[#647084] border-b border-[#E7EAF0] font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">Candidate</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4 text-center">Class</th>
                <th className="py-3 px-4 text-center">R1 Score</th>
                <th className="py-3 px-4 text-center">R2 Score</th>
                <th className="py-3 px-4 text-center">Total Points</th>
                <th className="py-3 px-4 text-center">Fullscreen Exits</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAF0]">
              {filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((entry) => {
                  const totalExits = competitionService.getParticipantFullscreenExitCount(entry.participant_id);

                  return (
                    <tr key={entry.participant_id} className="hover:bg-[#F8F9FC] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-[#172033]">
                          {entry.student_name}
                        </div>
                        <div className="text-[11px] text-[#8E9BAE] font-mono">
                          ID: {entry.participant_id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#647084] font-medium">
                        {entry.school_name}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F1F4F9] text-[#465FE5]">
                          {entry.student_class || '11th'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#172033]">
                        {entry.round_1_score !== undefined ? `${entry.round_1_score}` : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#172033]">
                        {entry.round_2_score !== undefined ? `${entry.round_2_score}` : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-black text-[#465FE5]">
                        {entry.total_score}
                      </td>

                      {/* Fullscreen Exits Telemetry */}
                      <td className="py-3.5 px-4 text-center">
                        {totalExits > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] font-mono">
                            <ShieldAlert className="w-3 h-3" />
                            {totalExits} Exits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9] font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            0 Exits
                          </span>
                        )}
                      </td>

                      {/* Action: Audit Details Modal */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => {
                            setAuditParticipantId(entry.participant_id);
                            setAuditStudentName(entry.student_name);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#E7EAF0] text-xs font-bold text-[#465FE5] hover:bg-[#E9EDFF] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8E9BAE] text-xs">
                    No candidate records match the active search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
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
          setIsResetModalOpen(false);
          refreshData();
        }}
      />
    </div>
  );
};
