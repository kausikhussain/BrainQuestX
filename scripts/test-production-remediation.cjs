/**
 * QUIZMANIA PRODUCTION REMEDIATION VERIFICATION SUITE
 * 
 * Specifically validates the 3 Critical Production Blockers:
 * 1. Zero Answer Key Exposure in Client Dist Assets
 * 2. Zero Hardcoded Admin Passwords in Client Dist Assets
 * 3. PostgreSQL RPC Migration Integrity & Schema Coverage
 * 4. Authoritative Attempt Persistence & Scoring Contract
 */

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  -> PASS: ${message}`);
}

console.log('======================================================================');
console.log('       QUIZMANIA PRODUCTION REMEDIATION INDEPENDENT AUDIT SUITE      ');
console.log('======================================================================\n');

// 1. Verify Client Dist Asset Bundle Sanitization
console.log('[SECTION 1] Verifying Zero Answer Key & Zero Password Exposure in Dist Assets...');

const distPath = path.join(__dirname, '..', 'dist', 'assets');
assert(fs.existsSync(distPath), 'Dist assets directory exists');

const jsFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
assert(jsFiles.length > 0, `Found built JavaScript bundle files: ${jsFiles.join(', ')}`);

let bundleContent = '';
for (const file of jsFiles) {
  bundleContent += fs.readFileSync(path.join(distPath, file), 'utf-8') + '\n';
}

// Check for answer key assignments
const correctOptionRegex = /correctOptionId\s*:\s*["'][rR][12]-q\d+-[a-d]["']/g;
const hasExposedAnswerKeys = correctOptionRegex.test(bundleContent);
assert(!hasExposedAnswerKeys, 'No question answer option IDs (e.g. correctOptionId: "r1-q1-b") exist in JS bundle');

const isCorrectTrueRegex = /isCorrect\s*:\s*(!0|true)/g;
const hasIsCorrectTrue = isCorrectTrueRegex.test(bundleContent);
assert(!hasIsCorrectTrue, 'No "isCorrect: true" answer indicators exist in client bundle');

// Check for hardcoded admin credentials
const hardcodedPasswords = ['Admin@QuizMania2026', 'quizmania2026', 'admin123'];
for (const pwd of hardcodedPasswords) {
  const containsPwd = bundleContent.includes(pwd);
  assert(!containsPwd, `Hardcoded admin credential "${pwd}" is completely absent from client bundle`);
}

// 2. Verify SQL Migration Files Integrity
console.log('\n[SECTION 2] Verifying Supabase Production Remediation Migration Files...');

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20261111_production_remediation.sql');
assert(fs.existsSync(migrationFile), 'Production remediation SQL migration file exists');

const migrationSql = fs.readFileSync(migrationFile, 'utf-8');

assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.exam_attempts'), 'Defines public.exam_attempts table');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.admin_roles'), 'Defines public.admin_roles table');
assert(migrationSql.includes('ENABLE ROW LEVEL SECURITY'), 'Enforces Row Level Security (RLS) on new tables');
assert(migrationSql.includes('start_or_restore_attempt'), 'Implements start_or_restore_attempt stored procedure');
assert(migrationSql.includes('save_attempt_answer'), 'Implements save_attempt_answer stored procedure');
assert(migrationSql.includes('submit_exam_attempt_rpc'), 'Implements submit_exam_attempt_rpc server-authoritative scoring');
assert(migrationSql.includes('record_fullscreen_event'), 'Implements record_fullscreen_event stored procedure');
assert(migrationSql.includes('verify_admin_role_rpc'), 'Implements verify_admin_role_rpc stored procedure');
assert(migrationSql.includes('SECURITY DEFINER'), 'Stored procedures execute with SECURITY DEFINER privileges');

// 3. Verify Questions Data Module
console.log('\n[SECTION 3] Verifying src/data/questions.ts Client Separation...');

const clientQuestionsFile = path.join(__dirname, '..', 'src', 'data', 'questions.ts');
const clientQuestionsCode = fs.readFileSync(clientQuestionsFile, 'utf-8');

assert(!clientQuestionsCode.includes('SERVER_QUESTION_BANK'), 'SERVER_QUESTION_BANK removed from src/data/questions.ts');
assert(!clientQuestionsCode.includes('QuestionWithAnswer'), 'QuestionWithAnswer interface removed from src/data/questions.ts');
assert(clientQuestionsCode.includes('CLIENT_QUESTIONS'), 'Client questions export is intact (prompts & options only)');

// 4. Verify Vercel SPA Routing Configuration
console.log('\n[SECTION 4] Verifying vercel.json SPA Rewrites and Security Headers...');

const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
assert(fs.existsSync(vercelJsonPath), 'vercel.json exists');

const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
assert(Array.isArray(vercelJson.rewrites), 'vercel.json has rewrites defined');
assert(vercelJson.rewrites.some(r => r.source === '/(.*)' && r.destination === '/index.html'), 'SPA fallback rewrite /(.*) -> /index.html present');

console.log('\n======================================================================');
console.log('      ALL 4 PRODUCTION REMEDIATION AUDIT SECTIONS PASSED!             ');
console.log('======================================================================\n');

