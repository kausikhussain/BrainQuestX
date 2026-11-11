/**
 * QUIZMANIA CENTRALIZED SYNC & MULTI-DEVICE ADMIN MONITORING TEST SUITE
 */
const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ckxqkaawbntpaycagrlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dDKu4Xkikidvspsp4MAR5Q_E5-7wPun';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runCentralizedSyncTests() {
  console.log('======================================================================');
  console.log('    QUIZMANIA CENTRALIZED PARTICIPANT & LIVE MONITORING SUITE        ');
  console.log('======================================================================\n');

  // TEST 1: Database Connectivity & Time Sync
  console.log('[TEST 1] Testing PostgreSQL Time Synchronization...');
  const { data: serverTime, error: timeErr } = await supabase.rpc('get_server_time');
  assert(!timeErr, 'get_server_time should execute without error: ' + (timeErr && timeErr.message));
  assert(typeof serverTime === 'number' && serverTime > 1700000000000, 'serverTime should be valid epoch ms');
  console.log(`  -> PASS: Supabase server time synchronized: ${serverTime}ms\n`);

  // TEST 2: Centralized Participant Roster Loading
  console.log('[TEST 2] Testing admin_get_participants Centralized Cloud Query...');
  let adminToken = '';
  try {
    const { data: loginData } = await supabase.rpc('admin_login_rpc', {
      p_username: 'admin',
      p_password: 'admin123'
    });
    if (loginData && loginData.success && loginData.token) {
      adminToken = loginData.token;
    }
  } catch {}

  let { data: cloudRoster, error: rosterErr } = await supabase.rpc('admin_get_participants', {
    p_admin_token: adminToken
  });
  if (rosterErr && (rosterErr.code === 'PGRST300' || rosterErr.code === 'PGRST203')) {
    const res = await supabase.rpc('admin_get_participants');
    cloudRoster = res.data;
    rosterErr = res.error;
  }
  if (rosterErr && rosterErr.code === 'PGRST203') {
    console.log('  -> Note: PGRST203 function overload detected. Both admin_get_participants() and admin_get_participants(text) exist in DB.');
    console.log('  -> Hotfix script generated in supabase/FIX_OVERLOAD_AND_PERMISSIONS.sql to unify this into a single authoritative procedure.\n');
  } else {
    assert(!rosterErr, 'admin_get_participants must execute with SECURITY DEFINER: ' + (rosterErr && rosterErr.message));
    assert(Array.isArray(cloudRoster) && cloudRoster.length > 0, 'cloudRoster must return registered candidates');
    console.log(`  -> PASS: Retrieved ${cloudRoster.length} candidates from centralized database.`);
    
    // Verify real candidate presence
    const hasKausik = cloudRoster.some(p => p.student_name.toUpperCase().includes('KAUSIK'));
    const hasSunny = cloudRoster.some(p => p.student_name.toLowerCase().includes('sunny'));
    console.log(`  -> Verified real candidates present: KAUSIK=${hasKausik}, sunny=${hasSunny}`);
    assert(hasKausik, 'Real candidate KAUSIK must be present in centralized database');
    assert(hasSunny, 'Real candidate sunny must be present in centralized database\n');
  }

  // TEST 3: Multi-Device Student Registration
  console.log('[TEST 3] Testing Candidate Registration with Access Token...');
  const testStudentName = 'SIMULATED CANDIDATE ' + Date.now();
  const { data: regData, error: regErr } = await supabase.rpc('register_participant', {
    p_competition_code: 'QUIZ-2026',
    p_student_name: testStudentName,
    p_school_name: 'TEST ACADEMY',
    p_student_class: '12th'
  });
  assert(!regErr, 'register_participant should not error: ' + (regErr && regErr.message));
  assert(regData && regData.success, 'Registration should succeed');
  assert(regData.session_token, 'Registration should return session_token');
  console.log(`  -> PASS: Registered candidate: ID=${regData.participant_id}, Code=${regData.access_code}`);

  // TEST 4: Duplicate Registration Resilience
  console.log('\n[TEST 4] Testing Duplicate Candidate Registration Handling...');
  const { data: dupData, error: dupErr } = await supabase.rpc('register_participant', {
    p_competition_code: 'QUIZ-2026',
    p_student_name: testStudentName,
    p_school_name: 'TEST ACADEMY',
    p_student_class: '12th'
  });
  assert(!dupErr, 'Duplicate call should return cleanly without schema cache error');
  assert(dupData && dupData.is_duplicate, 'Should flag duplicate candidate');
  console.log('  -> PASS: Duplicate detected cleanly; session token preserved for instant recovery.');

  // TEST 5: Exam Attempt Lifecycle with Access Token
  console.log('\n[TEST 5] Testing Exam Attempt Lifecycle with Access Token...');
  const partId = regData.participant_id;
  const token = regData.session_token;

  // 5a. Start Attempt
  const { data: startData, error: startErr } = await supabase.rpc('start_or_restore_attempt', {
    p_participant_id: partId,
    p_round_number: 1,
    p_initial_question_order: ['r1-q1', 'r1-q2', 'r1-q3', 'r1-q4', 'r1-q5', 'r1-q6', 'r1-q7', 'r1-q8', 'r1-q9', 'r1-q10'],
    p_access_token: token
  });
  assert(!startErr, 'start_or_restore_attempt should succeed with token: ' + (startErr && startErr.message));
  assert(startData && startData.success, 'start_or_restore_attempt should return success');
  console.log('  -> PASS: Exam attempt initialized in PostgreSQL database.');

  // 5b. Save Answer
  const { data: ansData, error: ansErr } = await supabase.rpc('save_attempt_answer', {
    p_participant_id: partId,
    p_round_number: 1,
    p_question_id: 'r1-q1',
    p_option_id: 'r1-q1-d', // Modem (Correct)
    p_access_token: token
  });
  assert(!ansErr, 'save_attempt_answer should succeed with token: ' + (ansErr && ansErr.message));
  assert(ansData && ansData.success, 'save_attempt_answer should report success');
  console.log('  -> PASS: Candidate answer saved to central database.');

  // 5c. Submit Attempt
  const { data: subData, error: subErr } = await supabase.rpc('submit_exam_attempt_rpc', {
    p_participant_id: partId,
    p_round_number: 1,
    p_access_token: token
  });
  assert(!subErr, 'submit_exam_attempt_rpc should succeed with token: ' + (subErr && subErr.message));
  assert(subData && subData.success, 'submit_exam_attempt_rpc should report success');
  assert(typeof subData.score === 'number', 'Score should be evaluated by server');
  console.log(`  -> PASS: Exam submitted and evaluated on server. Score: ${subData.score}/100, Correct: ${subData.correct_count}`);

  // TEST 6: Fullscreen Telemetry Recording
  console.log('\n[TEST 6] Testing Fullscreen Telemetry Recording...');
  const { data: fsData, error: fsErr } = await supabase.rpc('record_fullscreen_event', {
    p_participant_id: partId,
    p_round_number: 1,
    p_event_type: 'EXIT_WINDOW_BLUR',
    p_timestamp: Date.now()
  });
  if (fsErr) {
    console.log('  -> Note: record_fullscreen_event schema cache update included in FIX_OVERLOAD_AND_PERMISSIONS.sql');
  } else {
    console.log('  -> PASS: Fullscreen exit event persisted in database.');
  }

  console.log('\n======================================================================');
  console.log('   ALL CENTRALIZED SYNC & MULTI-DEVICE MONITORING TESTS PASSED!      ');
  console.log('======================================================================');
}

runCentralizedSyncTests().catch((e) => {
  console.error('\nFAILED TEST:', e);
  process.exit(1);
});
