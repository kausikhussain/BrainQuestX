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
  HelpCircle,
  GraduationCap
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
    <div className={`w-full min-h-screen ${isFullscreen ? 'bg-[#F8F9FC] p-6 sm:p-10' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16'} animate-fadeIn`}>
      
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#465FE5] bg-[#E9EDFF] border border-[#C5D0FF] px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-soft-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#465FE5]" />
              Unified Championship Standings
            </span>
            {isResultsPublished ? (
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9] inline-flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16845B]" />
                Official Finalized
              </span>
            ) : (
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#B7791F]" />
                Live Standings
              </span>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
            Official Leaderboard & Rankings
          </h1>
          <p className="text-xs sm:text-sm text-[#647084] mt-1">
            Deterministic evaluation cross-ranked by Total Score &rarr; Round 2 Score &rarr; Latency.
          </p>
        </div>

        {/* Search & Projector Action */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
            <input
              type="text"
              placeholder="Search candidate or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-[#E7EAF0] bg-white text-xs text-[#172033] placeholder-[#8E9BAE] focus:outline-none focus:ring-2 focus:ring-[#465FE5] shadow-soft-sm w-56 sm:w-64 font-medium"
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-[#E7EAF0] bg-white hover:bg-[#F8F9FC] text-[#647084] hover:text-[#172033] transition-colors flex items-center gap-1.5 text-xs font-bold shadow-soft-sm cursor-pointer"
            title="Toggle Auditorium Projector Mode"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Projector</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Projector Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#E7EAF0] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E9EDFF] flex items-center justify-center text-[#465FE5] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Candidates</span>
            <div className="text-2xl font-black text-[#172033] font-mono mt-0.5">{totalStudents}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7EAF0] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#B7791F] shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Top Score</span>
            <div className="text-2xl font-black text-[#172033] font-mono mt-0.5">{topScore} <span className="text-xs text-[#8E9BAE] font-normal">pts</span></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7EAF0] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#16845B] shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Qualified</span>
            <div className="text-2xl font-black text-[#172033] font-mono mt-0.5">{qualifiedCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7EAF0] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F1F4F9] flex items-center justify-center text-[#647084] shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#647084] uppercase tracking-wider font-mono">Institutions</span>
            <div className="text-2xl font-black text-[#172033] font-mono mt-0.5">{uniqueSchools}</div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium View */}
      {topThree.length > 0 && (
        <div className="mb-10">
          <Podium topThree={topThree} isResultsPublished={isResultsPublished} />
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#E7EAF0] rounded-3xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-[#E7EAF0] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#172033]">
              Unified Student Standings
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F1F4F9] text-[#647084]">
              {filtered.length} Recorded
            </span>
          </div>

          <div className="text-xs text-[#8E9BAE] font-medium flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            <span>Unified cross-school rankings without class separation</span>
          </div>
        </div>

        {/* Standings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8F9FC] text-[10px] uppercase font-bold text-[#647084] border-b border-[#E7EAF0] font-mono tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                <th className="py-3.5 px-4 sm:px-6">School</th>
                <th className="py-3.5 px-4 text-center">Class</th>
                <th className="py-3.5 px-4 text-center">Round 1</th>
                <th className="py-3.5 px-4 text-center">Round 2</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Total Score</th>
                <th className="py-3.5 px-4 text-center">Accuracy</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAF0]">
              {filtered.length > 0 ? (
                filtered.map((entry, index) => {
                  const rank = index + 1;
                  const isTopOne = rank === 1;
                  const isTopThree = rank <= 3;

                  return (
                    <tr 
                      key={entry.participant_id} 
                      className={`hover:bg-[#F8F9FC] transition-colors ${
                        isTopOne ? 'bg-[#FEF3C7]/20 font-medium' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        {rank === 1 ? (
                          <span className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A] font-black text-xs font-mono inline-flex items-center justify-center shadow-soft-sm">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs font-mono inline-flex items-center justify-center">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs font-mono inline-flex items-center justify-center">
                            3
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-[#8E9BAE]">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Candidate Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-extrabold text-[#172033]">
                          {entry.student_name}
                        </div>
                        <div className="text-[11px] text-[#8E9BAE] font-mono">
                          ID: {entry.participant_id.slice(0, 8)}
                        </div>
                      </td>

                      {/* School Name */}
                      <td className="py-4 px-4 sm:px-6 text-[#647084] font-medium">
                        {entry.school_name}
                      </td>

                      {/* Class */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F1F4F9] text-[#465FE5]">
                          <GraduationCap className="w-3 h-3" />
                          {entry.student_class || '11th'}
                        </span>
                      </td>

                      {/* Round 1 Score */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-[#172033]">
                        {entry.round_1_score !== undefined ? `${entry.round_1_score}` : '-'}
                      </td>

                      {/* Round 2 Score */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-[#172033]">
                        {entry.round_2_score !== undefined ? `${entry.round_2_score}` : '-'}
                      </td>

                      {/* Grand Total */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="text-base font-black font-mono text-[#465FE5]">
                          {entry.total_score}
                        </span>
                      </td>

                      {/* Accuracy */}
                      <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-[#647084]">
                        {entry.total_pct}%
                      </td>

                      {/* Qualification Status */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        {entry.is_qualified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9]">
                            <CheckCircle2 className="w-3 h-3" />
                            Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F4F9] text-[#647084]">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8E9BAE]">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No candidate attempts recorded yet</p>
                    <p className="text-xs mt-1">Scores will appear in real time once students submit their examinations.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
