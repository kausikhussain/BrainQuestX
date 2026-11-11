import React, { useState, useEffect } from 'react';
import { CompetitionState, Participant, StudentExamAttempt } from '../../types';
import { competitionService } from '../../services/competitionService';
import { LandingView } from './LandingView';
import { RegistrationView } from './RegistrationView';
import { ExamWelcomeView } from './ExamWelcomeView';
import { ExamInstructionsView } from './ExamInstructionsView';
import { ExamWorkspace } from './ExamWorkspace';
import { ExamResultView } from './ExamResultView';

interface StudentPortalProps {
  competitionState: CompetitionState;
  onNavigateToLeaderboard: () => void;
}

type StudentSubView = 
  | 'landing' 
  | 'register' 
  | 'welcome' 
  | 'instructions' 
  | 'exam' 
  | 'results';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  competitionState,
  onNavigateToLeaderboard,
}) => {
  const [activeStudent, setActiveStudent] = useState<Participant | null>(() =>
    competitionService.getActiveStudentSession()
  );

  const [activeRound, setActiveRound] = useState<1 | 2>(1);
  const [activeAttempt, setActiveAttempt] = useState<StudentExamAttempt | null>(null);

  // Sub-view determination
  const [subView, setSubView] = useState<StudentSubView>(() => {
    const student = competitionService.getActiveStudentSession();
    if (!student) return 'landing';

    // Check if unsubmitted attempt exists for Round 2
    const r2Attempt = competitionService.getActiveExamAttempt(student.id, 2);
    if (r2Attempt && !r2Attempt.isSubmitted) {
      return 'exam';
    }

    // Check if unsubmitted attempt exists for Round 1
    const r1Attempt = competitionService.getActiveExamAttempt(student.id, 1);
    if (r1Attempt && !r1Attempt.isSubmitted) {
      return 'exam';
    }

    // Check if Round 2 is finished
    if (r2Attempt && r2Attempt.isSubmitted) {
      return 'results';
    }

    // Check if Round 1 is finished
    if (r1Attempt && r1Attempt.isSubmitted) {
      return 'results';
    }

    return 'welcome';
  });

  // Keep activeAttempt in sync
  useEffect(() => {
    if (activeStudent) {
      const current = competitionService.getActiveExamAttempt(activeStudent.id, activeRound);
      setActiveAttempt(current);
    } else {
      setActiveAttempt(null);
    }
  }, [activeStudent, activeRound, subView]);

  // Handle registration success
  const handleRegistrationSuccess = () => {
    const student = competitionService.getActiveStudentSession();
    setActiveStudent(student);
    setActiveRound(1);
    setSubView('welcome');
  };

  const handleSwitchSession = () => {
    competitionService.clearStudentSession();
    setActiveStudent(null);
    setActiveAttempt(null);
    setActiveRound(1);
    setSubView('landing');
  };

  const isRound2Eligible = activeStudent ? competitionService.isStudentQualifiedForRound2(activeStudent.id) : false;

  const handleStartRound2 = () => {
    setActiveRound(2);
    setSubView('instructions');
  };

  const handleFinishExam = (completedAttempt: StudentExamAttempt) => {
    setActiveAttempt(completedAttempt);
    setSubView('results');
  };

  // If no student is logged in:
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

  // Active student present: Render corresponding sub-view in journey
  switch (subView) {
    case 'welcome':
      return (
        <ExamWelcomeView
          participant={activeStudent}
          competitionState={competitionState}
          onProceedToInstructions={() => setSubView('instructions')}
          onSwitchSession={handleSwitchSession}
          isRound2Eligible={isRound2Eligible}
          onStartRound2={handleStartRound2}
        />
      );

    case 'instructions':
      return (
        <ExamInstructionsView
          participant={activeStudent}
          competitionState={competitionState}
          roundNumber={activeRound}
          onStartExam={() => setSubView('exam')}
          onBackToWelcome={() => setSubView('welcome')}
        />
      );

    case 'exam':
      return (
        <ExamWorkspace
          participant={activeStudent}
          roundNumber={activeRound}
          onFinishExam={handleFinishExam}
        />
      );

    case 'results': {
      const resultAttempt = activeAttempt || competitionService.getStudentRoundResult(activeStudent.id, activeRound);
      if (!resultAttempt) {
        return (
          <ExamWelcomeView
            participant={activeStudent}
            competitionState={competitionState}
            onProceedToInstructions={() => setSubView('instructions')}
            onSwitchSession={handleSwitchSession}
            isRound2Eligible={isRound2Eligible}
            onStartRound2={handleStartRound2}
          />
        );
      }

      return (
        <ExamResultView
          participant={activeStudent}
          attempt={resultAttempt}
          competitionState={competitionState}
          onStartRound2={handleStartRound2}
          onViewLeaderboard={onNavigateToLeaderboard}
          onReturnToOverview={() => setSubView('welcome')}
        />
      );
    }

    case 'landing':
    default:
      return (
        <LandingView
          competitionState={competitionState}
          activeStudent={activeStudent}
          onStartRegistration={() => setSubView('register')}
          onEnterWaitingRoom={() => setSubView('welcome')}
        />
      );
  }
};
