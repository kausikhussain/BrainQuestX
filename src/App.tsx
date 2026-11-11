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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
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
      <footer className="border-t border-slate-200 py-6 px-4 bg-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900">QUIZMANIA</span>
            <span>&bull;</span>
            <span>Ultra-Premium School Examination Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Authoritative Evaluation Engine</span>
            <span>&bull;</span>
            <span className="font-mono text-indigo-600 font-semibold">Continuous Zero-Loss Auto-Save</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
