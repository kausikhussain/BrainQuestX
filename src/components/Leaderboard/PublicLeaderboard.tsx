import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Maximize2, 
  Minimize2, 
  Search, 
  Filter, 
  Sparkles, 
  Medal, 
  Info,
  Clock,
  Radio
} from 'lucide-react';
import { CompetitionState, LeaderboardEntry, StudentClass } from '../../types';
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
  const [classFilter, setClassFilter] = useState<'all' | '11th' | '12th'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeaderboard = async () => {
    const data = await competitionService.getLeaderboard();
    setLeaderboard(data);
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 3000);
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

  // Filtered entries
  const filtered = useMemo(() => {
    return leaderboard.filter((entry) => {
      const matchesClass = classFilter === 'all' || entry.student_class === classFilter;
      const matchesSearch =
        entry.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.school_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [leaderboard, classFilter, searchQuery]);

  const topThree = filtered.slice(0, 3);

  return (
    <div className={`w-full min-h-screen ${isFullscreen ? 'bg-[#0B1020] p-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
      {/* Title & Projector Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Live Competition Standings
            </span>
            {isResultsPublished ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Official Final Results
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Live Standings (Unpublished)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Inter-School Tournament Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Class 11th & 12th Official Technical Examination Rankings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter Tabs */}
          <div className="flex items-center bg-[#121A2B] p-1 rounded-xl border border-[#22304C]">
            <button
              onClick={() => setClassFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                classFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setClassFilter('11th')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                classFilter === '11th'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Class 11th
            </button>
            <button
              onClick={() => setClassFilter('12th')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                classFilter === '12th'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Class 12th
            </button>
          </div>

          {/* Projector Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#121A2B] hover:bg-[#162136] border border-[#22304C] text-slate-200 transition-all cursor-pointer shadow-md"
            title="Toggle Auditorium Projector View"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auditorium Projector Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Podium Section (Prominent Top 3) */}
      <Podium topThree={topThree} isResultsPublished={isResultsPublished} />

      {/* Search Bar & Tie-Breaker Legend */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl p-5 mb-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or school name..."
            className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#22304C] rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            <strong>Deterministic Tie-Breaker:</strong> 1. Total Points → 2. Round 2 (Python) Score → 3. Total Response Speed.
          </span>
        </div>
      </div>

      {/* Complete Rankings Table */}
      <div className="bg-[#121A2B] border border-[#22304C] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#22304C]">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">School</th>
                <th className="py-3.5 px-4 text-center">Class</th>
                <th className="py-3.5 px-4 text-center">Round 1 (General)</th>
                <th className="py-3.5 px-4 text-center">Round 2 (Python)</th>
                <th className="py-3.5 px-4 text-center">Total Score</th>
                <th className="py-3.5 px-4 text-right">Correct Qs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#19243A]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching participants found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  let rankBadge = (
                    <span className="font-mono font-bold text-slate-400">
                      #{entry.rank}
                    </span>
                  );

                  if (isFirst) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-extrabold text-xs">
                        1st
                      </span>
                    );
                  } else if (isSecond) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 font-mono font-extrabold text-xs">
                        2nd
                      </span>
                    );
                  } else if (isThird) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-800/30 text-amber-500 border border-amber-700/40 font-mono font-extrabold text-xs">
                        3rd
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={entry.participant_id}
                      className={`hover:bg-[#162136] transition-colors ${
                        isFirst ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm">
                          {entry.student_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {entry.school_name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                          Class {entry.student_class}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-300">
                        {entry.round_1_score}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-300">
                        {entry.round_2_score}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-indigo-400 text-base">
                          {entry.total_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {entry.correct_count} / 20
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

