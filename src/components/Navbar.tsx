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
  ShieldCheck,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#16845B] border border-[#C8E6C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] animate-pulse" />
            Registration Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#465FE5] animate-ping" />
            Round {competitionState.current_round_number} Live
          </span>
        );
      case 'results_published':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]">
            <Trophy className="w-3.5 h-3.5 text-[#B7791F]" />
            Official Standings Published
          </span>
        );
      case 'registration_closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F4F9] text-[#647084] border border-[#E7EAF0]">
            Registration Closed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF]">
            Championship Concluded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F4F9] text-[#647084] border border-[#E7EAF0]">
            Standby
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7EAF0] bg-white/95 backdrop-blur-md shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Section */}
        <div 
          onClick={() => onNavigate('student')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#465FE5] flex items-center justify-center text-white shadow-soft group-hover:bg-[#384EC9] transition-all">
            <span className="font-extrabold text-sm tracking-wider font-mono">
              QZ
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-[#172033] font-mono">
                QUIZMANIA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#E9EDFF] text-[#465FE5] border border-[#C5D0FF]">
                PLATFORM
              </span>
            </div>
            <p className="text-[11px] text-[#647084] hidden sm:block font-medium">
              School Examination Platform &bull; Two-Round Championship
            </p>
          </div>
        </div>

        {/* Center Navigation Pills */}
        <nav className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E7EAF0] p-1 rounded-xl shadow-soft-sm">
          <button
            onClick={() => onNavigate('student')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'student'
                ? 'bg-white text-[#465FE5] shadow-soft-sm border border-[#E7EAF0]'
                : 'text-[#647084] hover:text-[#172033]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student Portal</span>
            <span className="sm:hidden">Student</span>
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'leaderboard'
                ? 'bg-white text-[#465FE5] shadow-soft-sm border border-[#E7EAF0]'
                : 'text-[#647084] hover:text-[#172033]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
            <span className="sm:hidden">Ranks</span>
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'admin'
                ? 'bg-white text-[#465FE5] shadow-soft-sm border border-[#E7EAF0]'
                : 'text-[#647084] hover:text-[#172033]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Console</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            {getStatusBadge()}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#647084] pl-2 border-l border-[#E7EAF0]">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[11px] text-[#16845B] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                <Wifi className="w-3 h-3 text-[#16845B]" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-[#C2414A] font-semibold bg-[#FEE2E2] px-2 py-0.5 rounded-md border border-[#FCA5A5]">
                <WifiOff className="w-3 h-3 text-[#C2414A]" />
                Offline
              </span>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio Cues' : 'Mute Audio Cues'}
            className="w-8 h-8 rounded-lg border border-[#E7EAF0] bg-white hover:bg-[#F8F9FC] flex items-center justify-center text-[#647084] hover:text-[#172033] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#8E9BAE]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#465FE5]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
