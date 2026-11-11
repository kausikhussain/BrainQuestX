import React, { useState } from 'react';
import { 
  Trophy, 
  LayoutDashboard, 
  UserCheck, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX,
  Sparkles,
  BookOpen
} from 'lucide-react';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Registration Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            Round {competitionState.current_round_number} Live
          </span>
        );
      case 'results_published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Trophy className="w-3 h-3 text-amber-600" />
            Results Published
          </span>
        );
      case 'registration_closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Registration Closed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Competition Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Upcoming
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('student')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-soft group-hover:bg-indigo-700 transition-colors">
            <span className="font-extrabold text-sm tracking-wider font-mono">
              QZ
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-slate-900 font-mono">
                QUIZMANIA
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              School Examination Platform
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {getStatusBadge()}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-emerald-700 font-medium">Server Synchronized</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] text-rose-600 font-medium">Reconnecting...</span>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Sound Toggle + Navigation Tabs */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Navigation Switcher */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onNavigate('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'student'
                  ? 'bg-white text-indigo-700 shadow-soft-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Examination</span>
            </button>

            <button
              onClick={() => onNavigate('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'bg-white text-indigo-700 shadow-soft-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-white text-indigo-700 shadow-soft-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
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
