import React, { useState, useEffect } from 'react';
import { CompetitionState } from './types';
import { competitionService } from './services/competitionService';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PublicLeaderboard } from './components/Leaderboard/PublicLeaderboard';

export const App: React.FC = () => {
  const [competitionState, setCompetitionState] = useState<CompetitionState>(() =>
    competitionService.getCompetitionState()
  );

  // Determine initial view from URL hash if present
  const getInitialView = (): 'student' | 'admin' | 'leaderboard' => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) return 'admin';
      if (hash.includes('leaderboard') || hash.includes('projector') || hash.includes('results'))
        return 'leaderboard';
    }
    return 'student';
  };

  const [currentView, setCurrentView] = useState<'student' | 'admin' | 'leaderboard'>(getInitialView);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Subscribe to real-time competition state
  useEffect(() => {
    const unsubscribe = competitionService.subscribeToState((newState) => {
      setCompetitionState(newState);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync hash changes
    const handleHashChange = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleNavigate = (view: 'student' | 'admin' | 'leaderboard') => {
    setCurrentView(view);
    if (view === 'student') window.location.hash = '';
    else window.location.hash = view;
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        competitionState={competitionState}
        isOnline={isOnline}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentView === 'student' && (
          <StudentPortal
            competitionState={competitionState}
            onNavigateToLeaderboard={() => handleNavigate('leaderboard')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard competitionState={competitionState} />
        )}

        {currentView === 'leaderboard' && (
          <PublicLeaderboard competitionState={competitionState} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#19243A] py-6 px-4 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-400">QUIZMANIA</span>
            <span>•</span>
            <span>Competitive Technical Examination Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>High Concurrency Engine (60+ Participants)</span>
            <span>•</span>
            <span className="font-mono text-indigo-400">20s Authoritative Timer</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

