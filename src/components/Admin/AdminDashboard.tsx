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
  ShieldAlert
} from 'lucide-react';
import { CompetitionState, Participant, LeaderboardEntry, StudentClass } from '../../types';
import { CLIENT_QUESTIONS } from '../../data/questions';
import { competitionService } from '../../services/competitionService';
import { ResetModal } from './ResetModal';

interface AdminDashboardProps {
  competitionState: CompetitionState;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  competitionState,
}) => {
  // Authentication PIN
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('quizmania_admin_authed') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Participants & Leaderboard local data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'quizmania2026' || pinInput === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('quizmania_admin_authed', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
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

  // If not authenticated, show PIN gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Organizer Access Gate</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter administrator PIN to access the competition orchestrator.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (e.g. quizmania2026)"
              className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-[#22304C] focus:border-indigo-500 text-center font-mono text-white text-sm outline-none"
            />
            {pinError && (
              <p className="text-xs text-rose-400 font-medium">
                Incorrect PIN. Default is <code className="bg-slate-900 px-1 py-0.5 rounded">quizmania2026</code>
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Students</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalStudents}</div>
        </div>

        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Class 11th</span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">{class11Count}</div>
        </div>

        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Class 12th</span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 font-mono">{class12Count}</div>
        </div>

        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <School className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schools</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{uniqueSchools.length}</div>
        </div>

        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Submissions</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">{totalSubmissions}</div>
        </div>

        <div className="bg-[#121A2B] border border-[#22304C] p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Round Status</span>
          </div>
          <div className="text-sm font-bold text-white capitalize mt-1 truncate">
            {competitionState.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Orchestrator Controller Card */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#19243A]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
              Live Control Panel
            </span>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mt-0.5">
              <span>Competition Orchestration</span>
              {competitionState.status === 'in_progress' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  Round {competitionState.current_round_number} Active
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto Advance Toggle */}
            <button
              onClick={() => competitionService.setAutoAdvance(!competitionState.auto_advance)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                competitionState.auto_advance
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {competitionState.auto_advance ? (
                <ToggleRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-500" />
              )}
              <span>Auto-Advance 20s Timer ({competitionState.auto_advance ? 'ON' : 'OFF'})</span>
            </button>

            {/* Mock Students Seed (Rehearsal) */}
            <button
              onClick={() => {
                const count = competitionService.seedMockParticipants(60);
                refreshData();
                alert(`Added ${count} mock registered students across 8 schools!`);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed 60 Mock Students</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/15 text-rose-300 border border-rose-500/30 hover:bg-rose-600/25 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Action Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Registration Control */}
          <div className="bg-[#0B1020] p-4 rounded-xl border border-[#22304C]">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-2">
              Registration Gate
            </span>
            {competitionState.status === 'registration_open' ? (
              <button
                onClick={() => competitionService.setStatus('registration_closed')}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Registration</span>
              </button>
            ) : (
              <button
                onClick={() => competitionService.setStatus('registration_open')}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Open Registration</span>
              </button>
            )}
          </div>

          {/* Round 1 Control */}
          <div className="bg-[#0B1020] p-4 rounded-xl border border-[#22304C]">
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase block mb-2">
              Round 1 (General Paper)
            </span>
            {competitionState.status === 'in_progress' && competitionState.current_round_number === 1 ? (
              <button
                onClick={() => competitionService.endRound()}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End Round 1</span>
              </button>
            ) : (
              <button
                onClick={() => competitionService.startRound(1)}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Round 1 (10 Qs)</span>
              </button>
            )}
          </div>

          {/* Round 2 Control */}
          <div className="bg-[#0B1020] p-4 rounded-xl border border-[#22304C]">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase block mb-2">
              Round 2 (Subject Paper)
            </span>
            {competitionState.status === 'in_progress' && competitionState.current_round_number === 2 ? (
              <button
                onClick={() => competitionService.endRound()}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End Round 2</span>
              </button>
            ) : (
              <button
                onClick={() => competitionService.startRound(2)}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Round 2 (Python)</span>
              </button>
            )}
          </div>

          {/* Results Publishing */}
          <div className="bg-[#0B1020] p-4 rounded-xl border border-[#22304C]">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase block mb-2">
              Final Results
            </span>
            <button
              onClick={() => competitionService.publishResults()}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Publish Official Results</span>
            </button>
          </div>
        </div>

        {/* Live Question Telemetry & Jump Selector */}
        {competitionState.status === 'in_progress' && (
          <div className="mt-6 pt-6 border-t border-[#19243A]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono">
                  Active Question: Q{competitionState.current_question_number} of 10
                </span>
                <span className="text-xs text-slate-400">
                  Submissions: <strong className="text-emerald-400 font-mono">{currentQSubmissions}</strong> of {totalStudents}
                </span>
              </div>

              <button
                onClick={() => competitionService.advanceNextQuestion()}
                className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
              >
                <span>Advance Next Question</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick jump pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 mr-2 font-mono">Jump to:</span>
              {currentRoundQuestions.map((q) => {
                const isActive = q.id === competitionState.current_question_id;
                return (
                  <button
                    key={q.id}
                    onClick={() => competitionService.releaseQuestion(q.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-[#0B1020] text-slate-400 hover:text-white border border-[#22304C]'
                    }`}
                  >
                    Q{q.questionNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Participant Management Table */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Registered Participants & Live Scores</h3>
            <p className="text-xs text-slate-400">
              Real-time synchronization across all participating schools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or school..."
                className="pl-9 pr-3 py-2 bg-[#0B1020] border border-[#22304C] rounded-xl text-xs text-white placeholder-slate-500 outline-none w-52 focus:border-indigo-500"
              />
            </div>

            {/* Filter School */}
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#22304C] rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Filter Class */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-[#0B1020] border border-[#22304C] rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Classes</option>
              <option value="11th">Class 11th</option>
              <option value="12th">Class 12th</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0B1020] border border-[#22304C] hover:border-slate-600 text-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#22304C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#22304C]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Participant ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Round 1</th>
                <th className="py-3 px-4 text-center">Round 2</th>
                <th className="py-3 px-4 text-center">Total Score</th>
                <th className="py-3 px-4 text-right">Correct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#19243A]">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No participants registered yet. Use "Seed 60 Mock Students" or open registration.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((row) => {
                  const part = participants.find((p) => p.id === row.participant_id);
                  return (
                    <tr key={row.participant_id} className="hover:bg-[#162136] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                        #{row.rank}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                        {part?.access_code || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {row.student_name}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                        {row.school_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                          {row.student_class}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">
                        {row.round_1_score}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">
                        {row.round_2_score}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-indigo-400 text-sm">
                        {row.total_score}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {row.correct_count} / 20
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Reset Modal */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          competitionService.resetCompetition();
          refreshData();
        }}
      />
    </div>
  );
};

