import React, { useState } from 'react';
import { ShieldCheck, Trophy, LayoutDashboard, UserCheck, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { CompetitionState } from '../types';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentView: 'student' | 'admin' | 'leaderboard';
  onNavigate: (view: 'student' | 'admin' | 'leaderboard') => void;
  competitionState: CompetitionState;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  competitionState,
  isOnline,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());

  const handleToggleAudio = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const getStatusBadge = () => {
    switch (competitionState.status) {
      case 'registration_open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Registration Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Round {competitionState.current_round_number} Live
          </span>
        );
      case 'results_published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-3 h-3 text-amber-400" />
            Results Published
          </span>
        );
      case 'registration_closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            Registration Closed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Competition Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            Upcoming
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#22304C] bg-[#0B1020]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('student')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 text-lg">
                QZ
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white font-mono">
                QUIZMANIA
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Technical Competition Platform
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="hidden md:flex items-center gap-3">
          {getStatusBadge()}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Sync Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] text-rose-400 font-medium">Reconnecting</span>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Sound Toggle + Navigation Switcher */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
            className="p-2 rounded-xl bg-[#121A2B] border border-[#22304C] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Navigation Switcher */}
          <nav className="flex items-center gap-1 bg-[#121A2B] p-1 rounded-xl border border-[#22304C]">
            <button
              onClick={() => onNavigate('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'student'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Participant</span>
            </button>

            <button
              onClick={() => onNavigate('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
              <span className="sm:hidden">Ranks</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
