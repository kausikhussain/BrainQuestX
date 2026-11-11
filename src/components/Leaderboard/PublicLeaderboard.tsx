import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Maximize2, 
  Minimize2, 
  Search, 
  Sparkles, 
  Info,
  Clock,
  Medal,
  Users,
  Award,
  Flame,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { CompetitionState, LeaderboardEntry } from '../../types';
import { competitionService } from '../../services/competitionService';
import { Podium } from './Podium';

interface PublicLeaderboardProps {
  competitionState: CompetitionState;
}

export const PublicLeaderboard: React.FC<PublicLeaderboardProps> = ({
  competitionState,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeaderboard = async () => {
    const data = await competitionService.getLeaderboard();
    setLeaderboard(data);
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 2500);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  const isResultsPublished = competitionState.status === 'results_published';

  // Overall unified rankings: No class categorization
  const filtered = useMemo(() => {
    return leaderboard.filter((entry) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        entry.student_name.toLowerCase().includes(q) ||
        entry.school_name.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, searchQuery]);

  const topThree = filtered.slice(0, 3);

  // Summary statistics
  const totalStudents = leaderboard.length;
  const topScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.total_score)) : 0;
  const qualifiedCount = leaderboard.filter((e) => e.is_qualified).length;
  const uniqueSchools = Array.from(new Set(leaderboard.map((e) => e.school_name))).length;

  return (
    <div className={`w-full min-h-screen ${isFullscreen ? 'bg-slate-50 p-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} animate-fadeIn`}>
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-soft-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Unified Championship Standings
            </span>
            {isResultsPublished ? (
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Official Final Standings
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Live Standings (Real-Time Auto Sync)
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Inter-School Tournament Leaderboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Overall tournament rankings combining Round 1 (General Paper) and Round 2 (Python Subject Paper).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Projector Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-soft hover:shadow-soft-lg active:scale-95"
            title="Toggle Auditorium Projector View"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-indigo-600" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-indigo-600" />
                <span>Auditorium Projector Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Candidates</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{totalStudents}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Highest Score</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{topScore} <span className="text-xs text-slate-400 font-sans font-normal">pts</span></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Round 2 Qualifiers</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">{qualifiedCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-soft flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Participating Schools</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">{uniqueSchools}</div>
          </div>
        </div>
      </div>

      {/* Podium Component (Top 3 Candidates) */}
      {topThree.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft mb-8 pt-4 pb-2">
          <Podium topThree={topThree} isResultsPublished={isResultsPublished} />
        </div>
      )}

      {/* Search & Tie-Breaker Explanation */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-soft mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or school name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 placeholder-slate-400 font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/70 px-3.5 py-2 rounded-xl">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Deterministic Tie-Breaker:</strong> 1. Total Points &rarr; 2. Round 2 (Python) Score &rarr; 3. Response Speed.
          </span>
        </div>
      </div>

      {/* Standings Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Overall Participant Rankings
            </h2>
            <span className="text-xs text-slate-500 font-mono font-medium">
              ({filtered.length} {filtered.length === 1 ? 'Candidate' : 'Candidates'})
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Auto-refreshes every 2.5s
          </div>
        </div>

        {/* Unified Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-4 text-center w-20">Rank</th>
                <th className="py-3.5 px-4">Student Candidate</th>
                <th className="py-3.5 px-4">School / Institution</th>
                <th className="py-3.5 px-4 text-center font-mono">Round 1 (General)</th>
                <th className="py-3.5 px-4 text-center font-mono">Round 2 (Python)</th>
                <th className="py-3.5 px-4 text-center font-mono">Total Points</th>
                <th className="py-3.5 px-4 text-center font-mono">Correct Answers</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-medium">No candidates found matching &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query to see all participants.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isTopOne = row.rank === 1;
                  const isTopTwo = row.rank === 2;
                  const isTopThree = row.rank === 3;

                  return (
                    <tr 
                      key={row.participant_id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTopOne ? 'bg-amber-50/20' : isTopTwo ? 'bg-slate-50/40' : isTopThree ? 'bg-amber-50/10' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {isTopOne ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs shadow-soft-sm border border-amber-200">
                            1
                          </span>
                        ) : isTopTwo ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-200 text-slate-800 font-extrabold text-xs shadow-soft-sm border border-slate-300">
                            2
                          </span>
                        ) : isTopThree ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-50 text-amber-800 font-extrabold text-xs shadow-soft-sm border border-amber-300">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-600 font-semibold">#{row.rank}</span>
                        )}
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {row.student_name}
                      </td>

                      {/* School Name */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {row.school_name}
                      </td>

                      {/* Round 1 Score */}
                      <td className="py-3.5 px-4 font-mono font-bold text-center text-indigo-700">
                        {row.round_1_score}
                      </td>

                      {/* Round 2 Score */}
                      <td className="py-3.5 px-4 font-mono font-bold text-center text-blue-700">
                        {row.round_2_score}
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-center text-slate-900 text-base">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                          {row.total_score}
                        </span>
                      </td>

                      {/* Correct Count */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-center text-slate-600">
                        {row.correct_count} / 20
                      </td>

                      {/* Qualification Status */}
                      <td className="py-3.5 px-4 text-center">
                        {row.is_qualified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                            Participated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
