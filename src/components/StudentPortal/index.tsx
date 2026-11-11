import React, { useState } from 'react';
import { CompetitionState, Participant } from '../../types';
import { competitionService } from '../../services/competitionService';
import { LandingView } from './LandingView';
import { RegistrationView } from './RegistrationView';
import { WaitingRoomView } from './WaitingRoomView';
import { QuizInterface } from './QuizInterface';
import { RoundCompletionView } from './RoundCompletionView';

interface StudentPortalProps {
  competitionState: CompetitionState;
  onNavigateToLeaderboard: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  competitionState,
  onNavigateToLeaderboard,
}) => {
  const [activeStudent, setActiveStudent] = useState<Participant | null>(() =>
    competitionService.getActiveStudentSession()
  );
  const [subView, setSubView] = useState<'landing' | 'register' | 'waiting' | 'quiz'>('landing');

  // Handle registration success
  const handleRegistrationSuccess = () => {
    const student = competitionService.getActiveStudentSession();
    setActiveStudent(student);
    setSubView('waiting');
  };

  const handleLeaveSession = () => {
    competitionService.clearStudentSession();
    setActiveStudent(null);
    setSubView('landing');
  };

  // If student is registered and round is active, automatically show quiz!
  const isQuizActive = 
    activeStudent && 
    competitionState.status === 'in_progress' && 
    !!competitionState.current_question_id;

  const isRoundFinished = 
    activeStudent && 
    (competitionState.status === 'completed' || 
     competitionState.status === 'results_published' || 
     (competitionState.status === 'upcoming' && competitionState.current_round_number === 1 && !competitionState.current_question_id));

  if (!activeStudent) {
    if (subView === 'register') {
      return (
        <RegistrationView
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setSubView('landing')}
        />
      );
    }
    return (
      <LandingView
        competitionState={competitionState}
        activeStudent={null}
        onStartRegistration={() => setSubView('register')}
        onEnterWaitingRoom={() => setSubView('register')}
      />
    );
  }

  // Active student present:
  if (isQuizActive) {
    return (
      <QuizInterface
        participant={activeStudent}
        competitionState={competitionState}
      />
    );
  }

  if (isRoundFinished) {
    return (
      <RoundCompletionView
        participant={activeStudent}
        competitionState={competitionState}
        onViewLeaderboard={onNavigateToLeaderboard}
      />
    );
  }

  return (
    <WaitingRoomView
      participant={activeStudent}
      competitionState={competitionState}
      onLeaveSession={handleLeaveSession}
      onEnterQuizNow={() => setSubView('quiz')}
    />
  );
};
