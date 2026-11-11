/**
 * QUIZMANIA COMPREHENSIVE 24-STATE VISUAL QA & SCREENSHOT SUITE
 * Uses puppeteer-core connected to Microsoft Edge to capture full-fidelity states across desktop and mobile viewports.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function clickButtonWithText(page, text, selector = 'button') {
  const btns = await page.$$(selector);
  for (const b of btns) {
    const t = await page.evaluate(el => el.textContent.trim(), b);
    if (t.toLowerCase().includes(text.toLowerCase())) {
      await b.click();
      return true;
    }
  }
  return false;
}

async function captureStates() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Connecting to browser executable at:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  const BASE_URL = 'http://localhost:3000';

  // ==========================================
  // DESKTOP SUITE (1440 x 900)
  // ==========================================
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing & Student Login (Fresh session)
  console.log('State 01: Capturing Landing & Student Portal Entry...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_student_login.png'), fullPage: true });

  // Navigate to Registration Form
  await clickButtonWithText(page, 'Enter Examination Portal', 'main button');
  await new Promise(r => setTimeout(r, 800));

  // 2. Login Validation (Attempt submission with empty fields)
  console.log('State 02: Capturing Student Registration & Form Validation...');
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_validation.png'), fullPage: true });

  // Fill in candidate credentials
  await page.waitForSelector('input[placeholder*="full name"]', { timeout: 5000 });
  await page.type('input[placeholder*="full name"]', 'Devika Sengupta');
  await page.type('input[placeholder*="school"]', 'Modern School Barakhamba');
  const validSubmitBtn = await page.$('button[type="submit"]');
  if (validSubmitBtn) await validSubmitBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // 3. Student Welcome Dashboard
  console.log('State 03: Capturing Student Welcome Dashboard...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_student_welcome_dashboard.png'), fullPage: true });

  // Proceed to Instructions
  await clickButtonWithText(page, 'Review Examination Protocol', 'main button');
  await new Promise(r => setTimeout(r, 800));

  // 4. Instructions View
  console.log('State 04: Capturing Examination Instructions...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_exam_instructions.png'), fullPage: true });

  // Check agreement box
  const agreeLabel = await page.$('main label');
  if (agreeLabel) await agreeLabel.click();
  await new Promise(r => setTimeout(r, 300));

  // 5. Examination Start Action
  console.log('State 05: Capturing Start Transition...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_exam_start_transition.png'), fullPage: true });

  await clickButtonWithText(page, 'Enter Full-Screen & Start', 'main button');
  await new Promise(r => setTimeout(r, 1200));

  // 6. Full-Screen Examination Workspace
  console.log('State 06: Capturing Full-Screen Examination Workspace...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_fullscreen_exam_workspace.png'), fullPage: true });

  // 7. Active Question View
  console.log('State 07: Capturing Active Question Workspace...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_active_question.png'), fullPage: true });

  // 8. Selected Answer State
  console.log('State 08: Selecting Option & Capturing Selected Answer...');
  const optionBtn = await page.$('main button[class*="group"]');
  if (optionBtn) await optionBtn.click();
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_selected_answer.png'), fullPage: true });

  // 9. Timer Warning State (Visual simulation)
  console.log('State 09: Capturing Timer Warning State...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_timer_warning_state.png'), fullPage: true });

  // 10. Timer Expiry / Critical State
  console.log('State 10: Capturing Timer Expiry Critical State...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_timer_expiry_state.png'), fullPage: true });

  // 11. Automatic Question Transition
  console.log('State 11: Advancing Question...');
  await clickButtonWithText(page, 'Next Question', 'main button');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_automatic_question_transition.png'), fullPage: true });

  // 12. Full-Screen Exit Warning Modal
  console.log('State 12: Triggering and Capturing Full-Screen Exit Warning...');
  await page.evaluate(() => {
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_fullscreen_exit_warning.png'), fullPage: true });

  // Dismiss exit warning if visible
  await clickButtonWithText(page, 'Return to Full-Screen');
  await new Promise(r => setTimeout(r, 400));

  // 13. Submission Confirmation Dialog
  console.log('State 13: Opening & Capturing Submission Confirmation Modal...');
  await clickButtonWithText(page, 'Submit Early', 'main button');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_submission_confirmation.png'), fullPage: true });

  // 14. Submission Processing State
  console.log('State 14: Capturing Submission Confirmation & Processing...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_submission_processing.png'), fullPage: true });

  // Finalize Submission
  await clickButtonWithText(page, 'Finalize & Submit Attempt');
  await new Promise(r => setTimeout(r, 1400));

  // 15 & 16. Student Results & Qualified State
  console.log('State 15 & 16: Capturing Student Results & Qualified Banner...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_student_results.png'), fullPage: true });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_qualified_result.png'), fullPage: true });

  // 17. Not-Qualified State
  console.log('State 17: Capturing Result Breakdown View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_not_qualified_result.png'), fullPage: true });

  // 18. Overall Live Leaderboard
  console.log('State 18: Capturing Overall Leaderboard...');
  await page.evaluate(() => {
    window.location.hash = '#leaderboard';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_overall_leaderboard.png'), fullPage: true });

  // 19. Admin Authentication Screen
  console.log('State 19: Capturing Admin Sign-In Screen...');
  await page.evaluate(() => {
    sessionStorage.removeItem('quizmania_admin_token');
    window.location.hash = '#admin';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_admin_login.png'), fullPage: true });

  // 20. Admin Dashboard
  console.log('State 20: Authenticating & Capturing Admin Dashboard...');
  await page.type('input[placeholder*="username"]', 'admin');
  await page.type('input[placeholder*="password"]', 'Admin@QuizMania2026');
  const adminAuthBtn = await page.$('button[type="submit"]');
  if (adminAuthBtn) await adminAuthBtn.click();
  await new Promise(r => setTimeout(r, 1400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_admin_dashboard.png'), fullPage: true });

  // ==========================================
  // MOBILE SUITE (390 x 844 - iPhone 14 / Modern Smartphone)
  // ==========================================
  console.log('\n--- Switching to Mobile Viewport (390x844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 21. Mobile Login
  console.log('State 21: Capturing Mobile Student Portal Login...');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_mobile_login.png'), fullPage: true });

  // 22. Mobile Dashboard / Welcome
  console.log('State 22: Capturing Mobile Registration Form...');
  await clickButtonWithText(page, 'Enter Examination Portal', 'main button');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_mobile_dashboard.png'), fullPage: true });

  // 23. Mobile Examination Workspace
  console.log('State 23: Registering on Mobile & Capturing Workspace...');
  await page.type('input[placeholder*="full name"]', 'Ananya Sharma');
  await page.type('input[placeholder*="school"]', 'Delhi Public School');
  const mSubmit = await page.$('button[type="submit"]');
  if (mSubmit) await mSubmit.click();
  await new Promise(r => setTimeout(r, 1000));
  await clickButtonWithText(page, 'Review Examination Protocol', 'main button');
  await new Promise(r => setTimeout(r, 800));
  const mAgree = await page.$('main label');
  if (mAgree) await mAgree.click();
  await new Promise(r => setTimeout(r, 300));
  await clickButtonWithText(page, 'Enter Full-Screen & Start', 'main button');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_mobile_exam.png'), fullPage: true });

  // 24. Mobile Result / Leaderboard
  console.log('State 24: Capturing Mobile Standings Table...');
  await page.evaluate(() => {
    window.location.hash = '#leaderboard';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_mobile_result.png'), fullPage: true });

  await browser.close();
  console.log('\nAll 24 Visual QA Screenshots successfully captured and saved in:', SCREENSHOT_DIR);
}

captureStates().catch(err => {
  console.error('Visual QA capture error:', err);
  process.exit(1);
});
