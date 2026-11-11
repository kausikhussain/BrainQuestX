-- ============================================================================
-- QUIZMANIA SEED DATA: OFFICIAL QUESTION PAPERS (STEP 2)
-- Round 1: General Paper (10 Questions from Generalpaper.docx)
-- Round 2: Subject Paper (10 Questions from Subjectpaper.docx)
-- Safe & Idempotent: Does NOT truncate or delete any live candidate data!
-- ============================================================================

-- 1. Ensure Competition Exists
INSERT INTO public.competitions (
    id,
    code,
    title,
    description,
    status,
    current_round_number,
    duration_per_question,
    auto_advance
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'QUIZ-2026',
    'Inter-School Technical Quiz Competition 2026',
    'Offline technical examination for Class 11th & 12th students featuring General Tech & Python Programming rounds.',
    'registration_open',
    1,
    20,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure Rounds Exist
INSERT INTO public.rounds (
    id,
    competition_id,
    round_number,
    title,
    subtitle,
    description,
    duration_per_question,
    total_questions,
    status
) VALUES 
(
    'round-1',
    '00000000-0000-0000-0000-000000000001',
    1,
    'Round 1: General Paper',
    'Computer Fundamentals, Architecture & General Tech',
    '10 questions covering computer fundamentals, file formats, memory architecture and operating systems.',
    20,
    10,
    'active'
),
(
    'round-2',
    '00000000-0000-0000-0000-000000000001',
    2,
    'Round 2: Subject Paper',
    'Python Programming, Syntax & Data Structures',
    '10 questions evaluating core Python syntax, mutability, execution order, built-in functions, and indexing.',
    20,
    10,
    'pending'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. INSERT QUESTIONS & OPTIONS: ROUND 1 (General Paper)
-- ----------------------------------------------------------------------------

-- Q1
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q1', 'round-1', 1, 1, 'Which of the following is a communication device ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q1-a', 'r1-q1', 'A', 'Printer', false, 1),
('r1-q1-b', 'r1-q1', 'B', 'Monitor', false, 2),
('r1-q1-c', 'r1-q1', 'C', 'Keyboard', false, 3),
('r1-q1-d', 'r1-q1', 'D', 'Modem', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Q2
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q2', 'round-1', 1, 2, 'Which of the following file extensions indicate only graphics file ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q2-a', 'r1-q2', 'A', 'BMP and DOC', false, 1),
('r1-q2-b', 'r1-q2', 'B', 'JPEG and TXT', false, 2),
('r1-q2-c', 'r1-q2', 'C', 'TXT and STK', false, 3),
('r1-q2-d', 'r1-q2', 'D', 'BMP and GIF', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Q3
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q3', 'round-1', 1, 3, 'To create a para Break in MS-WORD , which key is used ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q3-a', 'r1-q3', 'A', 'Enter', true, 1),
('r1-q3-b', 'r1-q3', 'B', 'Esc', false, 2),
('r1-q3-c', 'r1-q3', 'C', 'Tab', false, 3),
('r1-q3-d', 'r1-q3', 'D', 'Shift', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q4
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q4', 'round-1', 1, 4, 'What type of software is Linux?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q4-a', 'r1-q4', 'A', 'Compiler', false, 1),
('r1-q4-b', 'r1-q4', 'B', 'Operating System', true, 2),
('r1-q4-c', 'r1-q4', 'C', 'Utility Software', false, 3),
('r1-q4-d', 'r1-q4', 'D', 'Application Software', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q5
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q5', 'round-1', 1, 5, 'Which software would you use to teach students in computer classes ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q5-a', 'r1-q5', 'A', 'Spreadsheet', false, 1),
('r1-q5-b', 'r1-q5', 'B', 'Database', false, 2),
('r1-q5-c', 'r1-q5', 'C', 'Word processing', false, 3),
('r1-q5-d', 'r1-q5', 'D', 'Power point', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Q6
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q6', 'round-1', 1, 6, 'Decimal equivalent of binary number 110111 is :', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q6-a', 'r1-q6', 'A', '55', true, 1),
('r1-q6-b', 'r1-q6', 'B', '56', false, 2),
('r1-q6-c', 'r1-q6', 'C', '57', false, 3),
('r1-q6-d', 'r1-q6', 'D', '58', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q7
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q7', 'round-1', 1, 7, '1 KB equals to how many bytes ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q7-a', 'r1-q7', 'A', '1000 bytes', false, 1),
('r1-q7-b', 'r1-q7', 'B', '1024  bytes', true, 2),
('r1-q7-c', 'r1-q7', 'C', '2012 bytes', false, 3),
('r1-q7-d', 'r1-q7', 'D', 'None of the above', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q8
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q8', 'round-1', 1, 8, 'Which of the following translates a program written in high level language into machine code ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q8-a', 'r1-q8', 'A', 'Assembler', false, 1),
('r1-q8-b', 'r1-q8', 'B', 'Compiler', false, 2),
('r1-q8-c', 'r1-q8', 'C', 'Interpreter', false, 3),
('r1-q8-d', 'r1-q8', 'D', 'Both B and C', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Q9
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q9', 'round-1', 1, 9, 'Which of the following is the fastest memory ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q9-a', 'r1-q9', 'A', 'Secondary memory', false, 1),
('r1-q9-b', 'r1-q9', 'B', 'Auxiliary memory', false, 2),
('r1-q9-c', 'r1-q9', 'C', 'Cache memory', true, 3),
('r1-q9-d', 'r1-q9', 'D', 'Virtual memory', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q10
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r1-q10', 'round-1', 1, 10, 'Which of the following file extensions indicate file created in paint ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r1-q10-a', 'r1-q10', 'A', 'BMP', true, 1),
('r1-q10-b', 'r1-q10', 'B', 'DOC', false, 2),
('r1-q10-c', 'r1-q10', 'C', 'STK', false, 3),
('r1-q10-d', 'r1-q10', 'D', 'PPT', false, 4)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. INSERT QUESTIONS & OPTIONS: ROUND 2 (Subject Paper - Python)
-- ----------------------------------------------------------------------------

-- Q1
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q1', 'round-2', 2, 1, 'Father of Python is   ……………………….', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q1-a', 'r2-q1', 'A', 'James Gosling', false, 1),
('r2-q1-b', 'r2-q1', 'B', 'Guido van Rossum', true, 2),
('r2-q1-c', 'r2-q1', 'C', 'Gudio van Rossam', false, 3),
('r2-q1-d', 'r2-q1', 'D', 'Dennis Ritchie', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q2
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q2', 'round-2', 2, 2, ' Which of the following is the correct identifier ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q2-a', 'r2-q2', 'A', 'Break', true, 1),
('r2-q2-b', 'r2-q2', 'B', 'def', false, 2),
('r2-q2-c', 'r2-q2', 'C', 'with', false, 3),
('r2-q2-d', 'r2-q2', 'D', 'global', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q3
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q3', 'round-2', 2, 3, 'Which of the following data type is immutable in Python?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q3-a', 'r2-q3', 'A', 'List', false, 1),
('r2-q3-b', 'r2-q3', 'B', 'Tuple', true, 2),
('r2-q3-c', 'r2-q3', 'C', 'Set', false, 3),
('r2-q3-d', 'r2-q3', 'D', 'Dictionary', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q4
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q4', 'round-2', 2, 4, 'What does the count() function in Python do?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q4-a', 'r2-q4', 'A', 'It counts the total number of characters in a string.', false, 1),
('r2-q4-b', 'r2-q4', 'B', 'It counts the occurrences of a specified substring with in a string.', true, 2),
('r2-q4-c', 'r2-q4', 'C', 'It returns true if all characters in the string are alphabets.', false, 3),
('r2-q4-d', 'r2-q4', 'D', 'It returns true if all characters in the string are numbers.', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q5
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q5', 'round-2', 2, 5, 'If a function  is defined to return a value but does not include a return statement, what will be the result ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q5-a', 'r2-q5', 'A', 'The function will return a default value of 0.', false, 1),
('r2-q5-b', 'r2-q5', 'B', 'The function will return an error.', false, 2),
('r2-q5-c', 'r2-q5', 'C', 'The function will return None.', true, 3),
('r2-q5-d', 'r2-q5', 'D', 'The function will return none.', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q6
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q6', 'round-2', 2, 6, 'Which Python datatype maintains the order of element inserted ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q6-a', 'r2-q6', 'A', 'set', false, 1),
('r2-q6-b', 'r2-q6', 'B', 'list', false, 2),
('r2-q6-c', 'r2-q6', 'C', 'dict', false, 3),
('r2-q6-d', 'r2-q6', 'D', 'Both B and C', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Q7
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q7', 'round-2', 2, 7, 'What is the significance of the break and else combination in a for loop ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q7-a', 'r2-q7', 'A', 'Executes else only if loop wasn’t exited by break.', true, 1),
('r2-q7-b', 'r2-q7', 'B', 'It is a syntax error; break else cannot be used together.', false, 2),
('r2-q7-c', 'r2-q7', 'C', 'It skips the current iteration.', false, 3),
('r2-q7-d', 'r2-q7', 'D', 'It restarts the loop.', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q8
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q8', 'round-2', 2, 8, 'Li = [‘Alex’ , ‘Emma’ , ‘Bob’ , ‘Lucas’]
print(li[1][-1])', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q8-a', 'r2-q8', 'A', 'x', false, 1),
('r2-q8-b', 'r2-q8', 'B', 'a', true, 2),
('r2-q8-c', 'r2-q8', 'C', 's', false, 3),
('r2-q8-d', 'r2-q8', 'D', 'b', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q9
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q9', 'round-2', 2, 9, 'li = list(range(100, 110))
print(li.index(105))', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q9-a', 'r2-q9', 'A', '105', false, 1),
('r2-q9-b', 'r2-q9', 'B', '5', true, 2),
('r2-q9-c', 'r2-q9', 'C', '106', false, 3),
('r2-q9-d', 'r2-q9', 'D', '104', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Q10
INSERT INTO public.questions (id, round_id, round_number, question_number, text, points)
VALUES ('r2-q10', 'round-2', 2, 10, 'Which of the following is a valid variable name in python ?', 10)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.question_options (id, question_id, label, text, is_correct, sort_order) VALUES
('r2-q10-a', 'r2-q10', 'A', '1variable', false, 1),
('r2-q10-b', 'r2-q10', 'B', 'my_variable', true, 2),
('r2-q10-c', 'r2-q10', 'C', 'global', false, 3),
('r2-q10-d', 'r2-q10', 'D', 'variable-1', false, 4)
ON CONFLICT (id) DO NOTHING;
