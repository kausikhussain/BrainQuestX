export interface QuestionOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  roundNumber: 1 | 2;
  questionNumber: number;
  text: string;
  points: number;
  options: QuestionOption[];
}

export interface CompetitionRound {
  id: string;
  roundNumber: 1 | 2;
  title: string;
  subtitle: string;
  description: string;
  durationPerQuestionSeconds: number;
  totalQuestions: number;
}

export interface ExamPaperMapping {
  roundNumber: 1 | 2;
  paperId: string;
  paperName: string;
  sourceFile: string;
  totalQuestions: number;
  timePerQuestionSeconds: number;
  totalDurationSeconds: number;
  maxMarks: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unanswered: number;
  };
}

export interface MarkingScheme {
  correctMarks: number;
  incorrectMarks: number;
  negativeEnabled: boolean;
  round1CutoffMarks: number;
  round1MaxMarks: number;
  round2MaxMarks: number;
  grandTotalMaxMarks: number;
}

export const OFFICIAL_ROUND_PAPERS: Record<1 | 2, ExamPaperMapping> = {
  1: {
    roundNumber: 1,
    paperId: 'general-paper',
    paperName: 'General Paper (Computer Fundamentals & Tech)',
    sourceFile: 'Generalpaper.docx',
    totalQuestions: 10,
    timePerQuestionSeconds: 20,
    totalDurationSeconds: 200,
    maxMarks: 100,
    markingScheme: { correct: 10, incorrect: 0, unanswered: 0 },
  },
  2: {
    roundNumber: 2,
    paperId: 'subject-paper-python',
    paperName: 'Subject Paper (Core Python Programming)',
    sourceFile: 'Subjectpaper.docx',
    totalQuestions: 10,
    timePerQuestionSeconds: 20,
    totalDurationSeconds: 200,
    maxMarks: 100,
    markingScheme: { correct: 10, incorrect: 0, unanswered: 0 },
  },
};

export const OFFICIAL_MARKING_SCHEME: MarkingScheme = {
  correctMarks: 10,
  incorrectMarks: 0,
  negativeEnabled: false,
  round1CutoffMarks: 60,
  round1MaxMarks: 100,
  round2MaxMarks: 100,
  grandTotalMaxMarks: 200,
};

export const getPaperConfig = (roundNumber: 1 | 2): ExamPaperMapping => {
  return OFFICIAL_ROUND_PAPERS[roundNumber];
};

export const COMPETITION_ROUNDS: CompetitionRound[] = [
  {
    id: 'round-1',
    roundNumber: 1,
    title: 'Round 1: General Paper',
    subtitle: 'Computer Fundamentals, Architecture & General Tech',
    description: '10 questions covering computer fundamentals, file formats, memory architecture and operating systems.',
    durationPerQuestionSeconds: 20,
    totalQuestions: 10,
  },
  {
    id: 'round-2',
    roundNumber: 2,
    title: 'Round 2: Subject Paper',
    subtitle: 'Python Programming, Syntax & Data Structures',
    description: '10 questions evaluating core Python syntax, mutability, execution order, built-in functions, and indexing.',
    durationPerQuestionSeconds: 20,
    totalQuestions: 10,
  },
];

/**
 * Public candidate-safe question repository.
 * Contains strictly question prompts and options.
 * Correct answers, option correctness flags, and answer keys
 * are NEVER stored here; they reside exclusively within PostgreSQL in Supabase.
 */
export const CLIENT_QUESTIONS: Question[] = [
  // ==================== ROUND 1: GENERAL PAPER ====================
  {
    id: 'r1-q1',
    roundNumber: 1,
    questionNumber: 1,
    text: 'Which of the following is a communication device ?',
    points: 10,
    options: [
      { id: 'r1-q1-a', label: 'A', text: 'Printer' },
      { id: 'r1-q1-b', label: 'B', text: 'Monitor' },
      { id: 'r1-q1-c', label: 'C', text: 'Keyboard' },
      { id: 'r1-q1-d', label: 'D', text: 'Modem' },
    ],
  },
  {
    id: 'r1-q2',
    roundNumber: 1,
    questionNumber: 2,
    text: 'Which of the following file extensions indicate only graphics file ?',
    points: 10,
    options: [
      { id: 'r1-q2-a', label: 'A', text: 'BMP and DOC' },
      { id: 'r1-q2-b', label: 'B', text: 'JPEG and TXT' },
      { id: 'r1-q2-c', label: 'C', text: 'TXT and STK' },
      { id: 'r1-q2-d', label: 'D', text: 'BMP and GIF' },
    ],
  },
  {
    id: 'r1-q3',
    roundNumber: 1,
    questionNumber: 3,
    text: 'To create a para Break in MS-WORD , which key is used ?',
    points: 10,
    options: [
      { id: 'r1-q3-a', label: 'A', text: 'Enter' },
      { id: 'r1-q3-b', label: 'B', text: 'Esc' },
      { id: 'r1-q3-c', label: 'C', text: 'Tab' },
      { id: 'r1-q3-d', label: 'D', text: 'Shift' },
    ],
  },
  {
    id: 'r1-q4',
    roundNumber: 1,
    questionNumber: 4,
    text: 'What type of software is Linux?',
    points: 10,
    options: [
      { id: 'r1-q4-a', label: 'A', text: 'Compiler' },
      { id: 'r1-q4-b', label: 'B', text: 'Operating System' },
      { id: 'r1-q4-c', label: 'C', text: 'Utility Software' },
      { id: 'r1-q4-d', label: 'D', text: 'Application Software' },
    ],
  },
  {
    id: 'r1-q5',
    roundNumber: 1,
    questionNumber: 5,
    text: 'Which software would you use to teach students in computer classes ?',
    points: 10,
    options: [
      { id: 'r1-q5-a', label: 'A', text: 'Spreadsheet' },
      { id: 'r1-q5-b', label: 'B', text: 'Database' },
      { id: 'r1-q5-c', label: 'C', text: 'Word processing' },
      { id: 'r1-q5-d', label: 'D', text: 'Power point' },
    ],
  },
  {
    id: 'r1-q6',
    roundNumber: 1,
    questionNumber: 6,
    text: 'Decimal equivalent of binary number 110111 is :',
    points: 10,
    options: [
      { id: 'r1-q6-a', label: 'A', text: '55' },
      { id: 'r1-q6-b', label: 'B', text: '56' },
      { id: 'r1-q6-c', label: 'C', text: '57' },
      { id: 'r1-q6-d', label: 'D', text: '58' },
    ],
  },
  {
    id: 'r1-q7',
    roundNumber: 1,
    questionNumber: 7,
    text: '1 KB equals to how many bytes ?',
    points: 10,
    options: [
      { id: 'r1-q7-a', label: 'A', text: '1000 bytes' },
      { id: 'r1-q7-b', label: 'B', text: '1024  bytes' },
      { id: 'r1-q7-c', label: 'C', text: '2012 bytes' },
      { id: 'r1-q7-d', label: 'D', text: 'None of the above' },
    ],
  },
  {
    id: 'r1-q8',
    roundNumber: 1,
    questionNumber: 8,
    text: 'Which of the following translates a program written in high level language into machine code ?',
    points: 10,
    options: [
      { id: 'r1-q8-a', label: 'A', text: 'Assembler' },
      { id: 'r1-q8-b', label: 'B', text: 'Compiler' },
      { id: 'r1-q8-c', label: 'C', text: 'Interpreter' },
      { id: 'r1-q8-d', label: 'D', text: 'Both B and C' },
    ],
  },
  {
    id: 'r1-q9',
    roundNumber: 1,
    questionNumber: 9,
    text: 'Which of the following is the fastest memory ?',
    points: 10,
    options: [
      { id: 'r1-q9-a', label: 'A', text: 'Secondary memory' },
      { id: 'r1-q9-b', label: 'B', text: 'Auxiliary memory' },
      { id: 'r1-q9-c', label: 'C', text: 'Cache memory' },
      { id: 'r1-q9-d', label: 'D', text: 'Virtual memory' },
    ],
  },
  {
    id: 'r1-q10',
    roundNumber: 1,
    questionNumber: 10,
    text: 'Which of the following file extensions indicate file created in paint ?',
    points: 10,
    options: [
      { id: 'r1-q10-a', label: 'A', text: 'BMP' },
      { id: 'r1-q10-b', label: 'B', text: 'DOC' },
      { id: 'r1-q10-c', label: 'C', text: 'STK' },
      { id: 'r1-q10-d', label: 'D', text: 'PPT' },
    ],
  },

  // ==================== ROUND 2: SUBJECT PAPER ====================
  {
    id: 'r2-q1',
    roundNumber: 2,
    questionNumber: 1,
    text: 'Father of Python is   ……………………….',
    points: 10,
    options: [
      { id: 'r2-q1-a', label: 'A', text: 'James Gosling' },
      { id: 'r2-q1-b', label: 'B', text: 'Guido van Rossum' },
      { id: 'r2-q1-c', label: 'C', text: 'Gudio van Rossam' },
      { id: 'r2-q1-d', label: 'D', text: 'Dennis Ritchie' },
    ],
  },
  {
    id: 'r2-q2',
    roundNumber: 2,
    questionNumber: 2,
    text: ' Which of the following is the correct identifier ?',
    points: 10,
    options: [
      { id: 'r2-q2-a', label: 'A', text: 'Break' },
      { id: 'r2-q2-b', label: 'B', text: 'def' },
      { id: 'r2-q2-c', label: 'C', text: 'with' },
      { id: 'r2-q2-d', label: 'D', text: 'global' },
    ],
  },
  {
    id: 'r2-q3',
    roundNumber: 2,
    questionNumber: 3,
    text: 'Which of the following data type is immutable in Python?',
    points: 10,
    options: [
      { id: 'r2-q3-a', label: 'A', text: 'List' },
      { id: 'r2-q3-b', label: 'B', text: 'Tuple' },
      { id: 'r2-q3-c', label: 'C', text: 'Set' },
      { id: 'r2-q3-d', label: 'D', text: 'Dictionary' },
    ],
  },
  {
    id: 'r2-q4',
    roundNumber: 2,
    questionNumber: 4,
    text: 'What does the count() function in Python do?',
    points: 10,
    options: [
      { id: 'r2-q4-a', label: 'A', text: 'It counts the total number of characters in a string.' },
      { id: 'r2-q4-b', label: 'B', text: 'It counts the occurrences of a specified substring with in a string.' },
      { id: 'r2-q4-c', label: 'C', text: 'It returns true if all characters in the string are alphabets.' },
      { id: 'r2-q4-d', label: 'D', text: 'It returns true if all characters in the string are numbers.' },
    ],
  },
  {
    id: 'r2-q5',
    roundNumber: 2,
    questionNumber: 5,
    text: 'If a function  is defined to return a value but does not include a return statement, what will be the result ?',
    points: 10,
    options: [
      { id: 'r2-q5-a', label: 'A', text: 'The function will return a default value of 0.' },
      { id: 'r2-q5-b', label: 'B', text: 'The function will return an error.' },
      { id: 'r2-q5-c', label: 'C', text: 'The function will return None.' },
      { id: 'r2-q5-d', label: 'D', text: 'The function will return none.' },
    ],
  },
  {
    id: 'r2-q6',
    roundNumber: 2,
    questionNumber: 6,
    text: 'Which Python datatype maintains the order of element inserted ?',
    points: 10,
    options: [
      { id: 'r2-q6-a', label: 'A', text: 'set' },
      { id: 'r2-q6-b', label: 'B', text: 'list' },
      { id: 'r2-q6-c', label: 'C', text: 'dict' },
      { id: 'r2-q6-d', label: 'D', text: 'Both B and C' },
    ],
  },
  {
    id: 'r2-q7',
    roundNumber: 2,
    questionNumber: 7,
    text: 'What is the significance of the break and else combination in a for loop ?',
    points: 10,
    options: [
      { id: 'r2-q7-a', label: 'A', text: 'Executes else only if loop wasn’t exited by break.' },
      { id: 'r2-q7-b', label: 'B', text: 'It is a syntax error; break else cannot be used together.' },
      { id: 'r2-q7-c', label: 'C', text: 'It skips the current iteration.' },
      { id: 'r2-q7-d', label: 'D', text: 'It restarts the loop.' },
    ],
  },
  {
    id: 'r2-q8',
    roundNumber: 2,
    questionNumber: 8,
    text: 'Li = [‘Alex’ , ‘Emma’ , ‘Bob’ , ‘Lucas’]\nprint(li[1][-1])',
    points: 10,
    options: [
      { id: 'r2-q8-a', label: 'A', text: 'x' },
      { id: 'r2-q8-b', label: 'B', text: 'a' },
      { id: 'r2-q8-c', label: 'C', text: 's' },
      { id: 'r2-q8-d', label: 'D', text: 'b' },
    ],
  },
  {
    id: 'r2-q9',
    roundNumber: 2,
    questionNumber: 9,
    text: 'li = list(range(100, 110))\nprint(li.index(105))',
    points: 10,
    options: [
      { id: 'r2-q9-a', label: 'A', text: '105' },
      { id: 'r2-q9-b', label: 'B', text: '5' },
      { id: 'r2-q9-c', label: 'C', text: '106' },
      { id: 'r2-q9-d', label: 'D', text: '104' },
    ],
  },
  {
    id: 'r2-q10',
    roundNumber: 2,
    questionNumber: 10,
    text: 'Which of the following is a valid variable name in python ?',
    points: 10,
    options: [
      { id: 'r2-q10-a', label: 'A', text: '1variable' },
      { id: 'r2-q10-b', label: 'B', text: 'my_variable' },
      { id: 'r2-q10-c', label: 'C', text: 'global' },
      { id: 'r2-q10-d', label: 'D', text: 'variable-1' },
    ],
  },
];

export const getRoundInfo = (roundNumber: 1 | 2): CompetitionRound => {
  return COMPETITION_ROUNDS[roundNumber - 1];
};

export const getClientQuestionsForRound = (roundNumber: 1 | 2): Question[] => {
  return CLIENT_QUESTIONS.filter((q) => q.roundNumber === roundNumber);
};

export const getMaxMarksForRound = (roundNumber: 1 | 2): number => {
  return getClientQuestionsForRound(roundNumber).reduce((sum, q) => sum + (q.points || 10), 0);
};
