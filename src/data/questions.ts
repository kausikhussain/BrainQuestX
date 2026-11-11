export interface QuestionOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionOptionWithAnswer extends QuestionOption {
  isCorrect: boolean;
}

export interface Question {
  id: string;
  roundNumber: 1 | 2;
  questionNumber: number;
  text: string;
  points: number;
  options: QuestionOption[];
}

export interface QuestionWithAnswer extends Question {
  options: QuestionOptionWithAnswer[];
  correctOptionId: string;
  explanation?: string;
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

export interface MarkingScheme {
  correctMarks: number;
  incorrectMarks: number;
  unansweredMarks: number;
  negativeMarkingEnabled: boolean;
}

export const OFFICIAL_MARKING_SCHEME: MarkingScheme = {
  correctMarks: 10,
  incorrectMarks: 0,
  unansweredMarks: 0,
  negativeMarkingEnabled: false,
};

export interface ExamPaperMapping {
  roundNumber: 1 | 2;
  paperId: 'general-paper' | 'subject-paper';
  paperName: string;
  sourceDoc: string;
  totalQuestions: 10;
  maxMarks: 100;
  durationMinutes: 10;
  description: string;
}

/**
 * MANDATORY PAPER ASSIGNMENT MAPPING
 * Round 1 = General Paper (Source: Generalpaper.docx)
 * Round 2 = Subject Paper (Source: Subjectpaper.docx)
 */
export const OFFICIAL_ROUND_PAPERS: Record<1 | 2, ExamPaperMapping> = {
  1: {
    roundNumber: 1,
    paperId: 'general-paper',
    paperName: 'General Paper',
    sourceDoc: 'Generalpaper.docx',
    totalQuestions: 10,
    maxMarks: 100,
    durationMinutes: 10,
    description: 'Initial screening assessment covering Computer Fundamentals, Communication Hardware, File Formats, Binary Numbers, and Operating Systems.',
  },
  2: {
    roundNumber: 2,
    paperId: 'subject-paper',
    paperName: 'Subject Paper (Python Programming)',
    sourceDoc: 'Subjectpaper.docx',
    totalQuestions: 10,
    maxMarks: 100,
    durationMinutes: 10,
    description: 'Second-stage examination for officially shortlisted candidates evaluating Python syntax, mutability, built-ins, loops, and indexing.',
  },
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
 * Server-authoritative Question Bank with verified answer keys.
 * Source: Generalpaper.docx and Subjectpaper.docx
 */
export const SERVER_QUESTION_BANK: QuestionWithAnswer[] = [
  // ==================== ROUND 1: GENERAL PAPER ====================
  // Source: Generalpaper.docx (Exactly 10 questions)
  {
    id: 'r1-q1',
    roundNumber: 1,
    questionNumber: 1,
    text: 'Which of the following is a communication device ?',
    points: 10,
    options: [
      { id: 'r1-q1-a', label: 'A', text: 'Printer', isCorrect: false },
      { id: 'r1-q1-b', label: 'B', text: 'Monitor', isCorrect: false },
      { id: 'r1-q1-c', label: 'C', text: 'Keyboard', isCorrect: false },
      { id: 'r1-q1-d', label: 'D', text: 'Modem', isCorrect: true },
    ],
    correctOptionId: 'r1-q1-d',
    explanation: 'A modem (modulator-demodulator) is a communication device that converts signals for transmission across networks.',
  },
  {
    id: 'r1-q2',
    roundNumber: 1,
    questionNumber: 2,
    text: 'Which of the following file extensions indicate only graphics file ?',
    points: 10,
    options: [
      { id: 'r1-q2-a', label: 'A', text: 'BMP and DOC', isCorrect: false },
      { id: 'r1-q2-b', label: 'B', text: 'JPEG and TXT', isCorrect: false },
      { id: 'r1-q2-c', label: 'C', text: 'TXT and STK', isCorrect: false },
      { id: 'r1-q2-d', label: 'D', text: 'BMP and GIF', isCorrect: true },
    ],
    correctOptionId: 'r1-q2-d',
    explanation: 'BMP (Bitmap) and GIF (Graphics Interchange Format) are both graphics/image file formats.',
  },
  {
    id: 'r1-q3',
    roundNumber: 1,
    questionNumber: 3,
    text: 'To create a para Break in MS-WORD , which key is used ?',
    points: 10,
    options: [
      { id: 'r1-q3-a', label: 'A', text: 'Enter', isCorrect: true },
      { id: 'r1-q3-b', label: 'B', text: 'Esc', isCorrect: false },
      { id: 'r1-q3-c', label: 'C', text: 'Tab', isCorrect: false },
      { id: 'r1-q3-d', label: 'D', text: 'Shift', isCorrect: false },
    ],
    correctOptionId: 'r1-q3-a',
    explanation: 'Pressing Enter creates a paragraph break in Microsoft Word (Shift+Enter creates a line break).',
  },
  {
    id: 'r1-q4',
    roundNumber: 1,
    questionNumber: 4,
    text: 'What type of software is Linux?',
    points: 10,
    options: [
      { id: 'r1-q4-a', label: 'A', text: 'Compiler', isCorrect: false },
      { id: 'r1-q4-b', label: 'B', text: 'Operating System', isCorrect: true },
      { id: 'r1-q4-c', label: 'C', text: 'Utility Software', isCorrect: false },
      { id: 'r1-q4-d', label: 'D', text: 'Application Software', isCorrect: false },
    ],
    correctOptionId: 'r1-q4-b',
    explanation: 'Linux is an open-source Unix-like operating system kernel and operating system family.',
  },
  {
    id: 'r1-q5',
    roundNumber: 1,
    questionNumber: 5,
    text: 'Which software would you use to teach students in computer classes ?',
    points: 10,
    options: [
      { id: 'r1-q5-a', label: 'A', text: 'Spreadsheet', isCorrect: false },
      { id: 'r1-q5-b', label: 'B', text: 'Database', isCorrect: false },
      { id: 'r1-q5-c', label: 'C', text: 'Word processing', isCorrect: false },
      { id: 'r1-q5-d', label: 'D', text: 'Power point', isCorrect: true },
    ],
    correctOptionId: 'r1-q5-d',
    explanation: 'PowerPoint presentation software is designed for classroom teaching, lecture slides, and presentations.',
  },
  {
    id: 'r1-q6',
    roundNumber: 1,
    questionNumber: 6,
    text: 'Decimal equivalent of binary number 110111 is :',
    points: 10,
    options: [
      { id: 'r1-q6-a', label: 'A', text: '55', isCorrect: true },
      { id: 'r1-q6-b', label: 'B', text: '56', isCorrect: false },
      { id: 'r1-q6-c', label: 'C', text: '57', isCorrect: false },
      { id: 'r1-q6-d', label: 'D', text: '58', isCorrect: false },
    ],
    correctOptionId: 'r1-q6-a',
    explanation: '110111 in binary = 1*32 + 1*16 + 0*8 + 1*4 + 1*2 + 1*1 = 32 + 16 + 4 + 2 + 1 = 55.',
  },
  {
    id: 'r1-q7',
    roundNumber: 1,
    questionNumber: 7,
    text: '1 KB equals to how many bytes ?',
    points: 10,
    options: [
      { id: 'r1-q7-a', label: 'A', text: '1000 bytes', isCorrect: false },
      { id: 'r1-q7-b', label: 'B', text: '1024  bytes', isCorrect: true },
      { id: 'r1-q7-c', label: 'C', text: '2012 bytes', isCorrect: false },
      { id: 'r1-q7-d', label: 'D', text: 'None of the above', isCorrect: false },
    ],
    correctOptionId: 'r1-q7-b',
    explanation: '1 Kilobyte (KB) in standard binary computing equals 2^10 = 1024 bytes.',
  },
  {
    id: 'r1-q8',
    roundNumber: 1,
    questionNumber: 8,
    text: 'Which of the following translates a program written in high level language into machine code ?',
    points: 10,
    options: [
      { id: 'r1-q8-a', label: 'A', text: 'Assembler', isCorrect: false },
      { id: 'r1-q8-b', label: 'B', text: 'Compiler', isCorrect: false },
      { id: 'r1-q8-c', label: 'C', text: 'Interpreter', isCorrect: false },
      { id: 'r1-q8-d', label: 'D', text: 'Both B and C', isCorrect: true },
    ],
    correctOptionId: 'r1-q8-d',
    explanation: 'Both compilers (translating entire code before execution) and interpreters (translating line by line) translate high level code.',
  },
  {
    id: 'r1-q9',
    roundNumber: 1,
    questionNumber: 9,
    text: 'Which of the following is the fastest memory ?',
    points: 10,
    options: [
      { id: 'r1-q9-a', label: 'A', text: 'Secondary memory', isCorrect: false },
      { id: 'r1-q9-b', label: 'B', text: 'Auxiliary memory', isCorrect: false },
      { id: 'r1-q9-c', label: 'C', text: 'Cache memory', isCorrect: true },
      { id: 'r1-q9-d', label: 'D', text: 'Virtual memory', isCorrect: false },
    ],
    correctOptionId: 'r1-q9-c',
    explanation: 'Cache memory sits closest to the CPU processor and operates at the fastest access speed among the listed options.',
  },
  {
    id: 'r1-q10',
    roundNumber: 1,
    questionNumber: 10,
    text: 'Which of the following file extensions indicate file created in paint ?',
    points: 10,
    options: [
      { id: 'r1-q10-a', label: 'A', text: 'BMP', isCorrect: true },
      { id: 'r1-q10-b', label: 'B', text: 'DOC', isCorrect: false },
      { id: 'r1-q10-c', label: 'C', text: 'STK', isCorrect: false },
      { id: 'r1-q10-d', label: 'D', text: 'PPT', isCorrect: false },
    ],
    correctOptionId: 'r1-q10-a',
    explanation: 'BMP (Bitmap) is the classic native raster image format created and saved by Microsoft Paint.',
  },

  // ==================== ROUND 2: SUBJECT PAPER ====================
  // Source: Subjectpaper.docx (Exactly 10 questions)
  {
    id: 'r2-q1',
    roundNumber: 2,
    questionNumber: 1,
    text: 'Father of Python is   ……………………….',
    points: 10,
    options: [
      { id: 'r2-q1-a', label: 'A', text: 'James Gosling', isCorrect: false },
      { id: 'r2-q1-b', label: 'B', text: 'Guido van Rossum', isCorrect: true },
      { id: 'r2-q1-c', label: 'C', text: 'Gudio van Rossam', isCorrect: false },
      { id: 'r2-q1-d', label: 'D', text: 'Dennis Ritchie', isCorrect: false },
    ],
    correctOptionId: 'r2-q1-b',
    explanation: 'Guido van Rossum created Python in the late 1980s at CWI in the Netherlands.',
  },
  {
    id: 'r2-q2',
    roundNumber: 2,
    questionNumber: 2,
    text: 'Which of the following is the correct identifier ?',
    points: 10,
    options: [
      { id: 'r2-q2-a', label: 'A', text: 'Break', isCorrect: true },
      { id: 'r2-q2-b', label: 'B', text: 'def', isCorrect: false },
      { id: 'r2-q2-c', label: 'C', text: 'with', isCorrect: false },
      { id: 'r2-q2-d', label: 'D', text: 'global', isCorrect: false },
    ],
    correctOptionId: 'r2-q2-a',
    explanation: 'Python is case-sensitive. While "break", "def", "with", and "global" are reserved keywords, "Break" (capital B) is a valid identifier.',
  },
  {
    id: 'r2-q3',
    roundNumber: 2,
    questionNumber: 3,
    text: 'Which of the following data type is immutable in Python?',
    points: 10,
    options: [
      { id: 'r2-q3-a', label: 'A', text: 'List', isCorrect: false },
      { id: 'r2-q3-b', label: 'B', text: 'Tuple', isCorrect: true },
      { id: 'r2-q3-c', label: 'C', text: 'Set', isCorrect: false },
      { id: 'r2-q3-d', label: 'D', text: 'Dictionary', isCorrect: false },
    ],
    correctOptionId: 'r2-q3-b',
    explanation: 'Tuples cannot be modified after creation, making them immutable in Python.',
  },
  {
    id: 'r2-q4',
    roundNumber: 2,
    questionNumber: 4,
    text: 'What does the count() function in Python do?',
    points: 10,
    options: [
      { id: 'r2-q4-a', label: 'A', text: 'It counts the total number of characters in a string.', isCorrect: false },
      { id: 'r2-q4-b', label: 'B', text: 'It counts the occurrences of a specified substring with in a string.', isCorrect: true },
      { id: 'r2-q4-c', label: 'C', text: 'It returns true if all characters in the string are alphabets.', isCorrect: false },
      { id: 'r2-q4-d', label: 'D', text: 'It returns true if all characters in the string are numbers.', isCorrect: false },
    ],
    correctOptionId: 'r2-q4-b',
    explanation: 'str.count(sub) returns the number of non-overlapping occurrences of substring sub in the string.',
  },
  {
    id: 'r2-q5',
    roundNumber: 2,
    questionNumber: 5,
    text: 'If a function  is defined to return a value but does not include a return statement, what will be the result ?',
    points: 10,
    options: [
      { id: 'r2-q5-a', label: 'A', text: 'The function will return a default value of 0.', isCorrect: false },
      { id: 'r2-q5-b', label: 'B', text: 'The function will return an error.', isCorrect: false },
      { id: 'r2-q5-c', label: 'C', text: 'The function will return None.', isCorrect: true },
      { id: 'r2-q5-d', label: 'D', text: 'The function will return none.', isCorrect: false },
    ],
    correctOptionId: 'r2-q5-c',
    explanation: 'In Python, if a function terminates without an explicit return statement, it implicitly returns None (with capital N).',
  },
  {
    id: 'r2-q6',
    roundNumber: 2,
    questionNumber: 6,
    text: 'Which Python datatype maintains the order of element inserted ?',
    points: 10,
    options: [
      { id: 'r2-q6-a', label: 'A', text: 'set', isCorrect: false },
      { id: 'r2-q6-b', label: 'B', text: 'list', isCorrect: false },
      { id: 'r2-q6-c', label: 'C', text: 'dict', isCorrect: false },
      { id: 'r2-q6-d', label: 'D', text: 'Both B and C', isCorrect: true },
    ],
    correctOptionId: 'r2-q6-d',
    explanation: 'Both lists and dictionaries (in standard Python 3.7+) maintain the insertion order of elements.',
  },
  {
    id: 'r2-q7',
    roundNumber: 2,
    questionNumber: 7,
    text: 'What is the significance of the break and else combination in a for loop ?',
    points: 10,
    options: [
      { id: 'r2-q7-a', label: 'A', text: 'Executes else only if loop wasn’t exited by break.', isCorrect: true },
      { id: 'r2-q7-b', label: 'B', text: 'It is a syntax error; break else cannot be used together.', isCorrect: false },
      { id: 'r2-q7-c', label: 'C', text: 'It skips the current iteration.', isCorrect: false },
      { id: 'r2-q7-d', label: 'D', text: 'It restarts the loop.', isCorrect: false },
    ],
    correctOptionId: 'r2-q7-a',
    explanation: 'The else block in a for loop runs only if the loop completed normally without encountering a break statement.',
  },
  {
    id: 'r2-q8',
    roundNumber: 2,
    questionNumber: 8,
    text: 'Li = [‘Alex’ , ‘Emma’ , ‘Bob’ , ‘Lucas’]\nprint(li[1][-1])',
    points: 10,
    options: [
      { id: 'r2-q8-a', label: 'A', text: 'x', isCorrect: false },
      { id: 'r2-q8-b', label: 'B', text: 'a', isCorrect: true },
      { id: 'r2-q8-c', label: 'C', text: 's', isCorrect: false },
      { id: 'r2-q8-d', label: 'D', text: 'b', isCorrect: false },
    ],
    correctOptionId: 'r2-q8-b',
    explanation: 'li[1] accesses the second element "Emma". Index [-1] accesses its last character, which is "a". Note: In official school examinations, variable casing "Li" vs "li" is evaluated conceptually as "a".',
  },
  {
    id: 'r2-q9',
    roundNumber: 2,
    questionNumber: 9,
    text: 'li = list(range(100, 110))\nprint(li.index(105))',
    points: 10,
    options: [
      { id: 'r2-q9-a', label: 'A', text: '105', isCorrect: false },
      { id: 'r2-q9-b', label: 'B', text: '5', isCorrect: true },
      { id: 'r2-q9-c', label: 'C', text: '106', isCorrect: false },
      { id: 'r2-q9-d', label: 'D', text: '104', isCorrect: false },
    ],
    correctOptionId: 'r2-q9-b',
    explanation: 'The list is [100, 101, 102, 103, 104, 105, 106, 107, 108, 109]. The element 105 is at 0-based index 5.',
  },
  {
    id: 'r2-q10',
    roundNumber: 2,
    questionNumber: 10,
    text: 'Which of the following is a valid variable name in python ?',
    points: 10,
    options: [
      { id: 'r2-q10-a', label: 'A', text: '1variable', isCorrect: false },
      { id: 'r2-q10-b', label: 'B', text: 'my_variable', isCorrect: true },
      { id: 'r2-q10-c', label: 'C', text: 'global', isCorrect: false },
      { id: 'r2-q10-d', label: 'D', text: 'variable-1', isCorrect: false },
    ],
    correctOptionId: 'r2-q10-b',
    explanation: 'my_variable conforms to identifier rules: cannot start with a digit, cannot be a keyword, and cannot contain hyphens.',
  },
];

/**
 * Public client-safe questions with isCorrect stripped.
 * Used during active quiz display.
 */
export const CLIENT_QUESTIONS: Question[] = SERVER_QUESTION_BANK.map((q) => ({
  id: q.id,
  roundNumber: q.roundNumber,
  questionNumber: q.questionNumber,
  text: q.text,
  points: q.points,
  options: q.options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    text: opt.text,
  })),
}));

export const getPaperConfig = (roundNumber: 1 | 2): ExamPaperMapping => {
  return OFFICIAL_ROUND_PAPERS[roundNumber];
};

export const getQuestionsForRound = (roundNumber: 1 | 2): Question[] => {
  return CLIENT_QUESTIONS.filter((q) => q.roundNumber === roundNumber);
};

export const getServerQuestionsForRound = (roundNumber: 1 | 2): QuestionWithAnswer[] => {
  return SERVER_QUESTION_BANK.filter((q) => q.roundNumber === roundNumber);
};

export const calculateRoundMaxMarks = (roundNumber: 1 | 2): number => {
  return getServerQuestionsForRound(roundNumber).reduce((sum, q) => sum + (q.points || 10), 0);
};
