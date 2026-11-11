/**
 * QUIZMANIA VISUAL VERIFICATION & SCREENSHOT CAPTURE SUITE
 * Uses puppeteer-core connected to Microsoft Edge to capture full-fidelity states.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function captureStates() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Connecting to Edge browser at:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const BASE_URL = 'http://localhost:3000';

  console.log('1. Capturing Landing Page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00_landing_page.png'), fullPage: true });

  console.log('2. Clicking Enter Examination Portal...');
  const enterBtn = await page.$('button');
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt.includes('Enter Examination') || txt.includes('Register') || txt.includes('Portal')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 800));
  console.log('3. Capturing Student Registration View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_student_registration.png'), fullPage: true });

  console.log('4. Filling Student Details (Name, School, Class)...');
  await page.type('input[placeholder*="full name"]', 'Devika Sengupta');
  await page.type('input[placeholder*="school"]', 'Modern School Barakhamba');

  // Submit registration form
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 1200));
  console.log('5. Capturing Candidate Briefing / Welcome View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_candidate_welcome.png'), fullPage: true });

  // Click proceed to instructions
  const welcomeBtns = await page.$$('button');
  for (const btn of welcomeBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Instructions') || text.includes('Proceed') || text.includes('Continue')) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 800));
  console.log('6. Capturing Instructions View with 20s rules & Full-Screen notice...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_exam_instructions.png'), fullPage: true });

  // Check agreement box
  const agreeLabel = await page.$('label');
  if (agreeLabel) {
    await agreeLabel.click();
  }

  await new Promise(r => setTimeout(r, 400));
  // Click Start Examination
  const instrBtns = await page.$$('button');
  for (const btn of instrBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Start Examination') || text.includes('Start Round')) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1200));
  console.log('7. Capturing 20-Second Exam Workspace with Active Timer & Randomized Order...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_exam_workspace_20s_timer.png'), fullPage: true });

  // Select option on Question 1
  const optionBtn = await page.$('button[class*="group"]');
  if (optionBtn) {
    await optionBtn.click();
  }

  await new Promise(r => setTimeout(r, 500));
  console.log('8. Capturing Selected Option State...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_question_selected.png'), fullPage: true });

  // Answer remaining questions to complete the exam
  for (let q = 1; q <= 9; q++) {
    const nextBtns = await page.$$('button');
    for (const btn of nextBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Confirm & Next') || text.includes('Next Question') || text.includes('Save & Next')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 300));
    // Select option
    const opt = await page.$('button[class*="group"]');
    if (opt) await opt.click();
  }

  // Finalize on Question 10
  const finalBtns = await page.$$('button');
  for (const btn of finalBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Finalize') || text.includes('Confirm & Finalize') || text.includes('Submit')) {
      await btn.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1500));
  console.log('9. Capturing Exam Result & Qualification View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_exam_result_view.png'), fullPage: true });

  console.log('10. Capturing Public Leaderboard View...');
  await page.evaluate(() => {
    window.location.hash = '#leaderboard';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_public_leaderboard.png'), fullPage: true });

  console.log('11. Capturing Admin Sign-In Screen (Role-Protected Gate)...');
  await page.evaluate(() => {
    window.location.hash = '#admin';
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_signin_gate.png'), fullPage: true });

  console.log('12. Authenticating as Administrator & Capturing Console with Fullscreen Telemetry...');
  await page.type('input[placeholder*="username"]', 'admin');
  await page.type('input[placeholder*="secret"]', 'Admin@QuizMania2026');
  const authBtn = await page.$('button[type="submit"]');
  if (authBtn) await authBtn.click();

  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_dashboard_authenticated.png'), fullPage: true });

  await browser.close();
  console.log('\nAll 10 visual states captured successfully! Saved to:', SCREENSHOT_DIR);
}

captureStates().catch(err => {
  console.error('Screenshot capture error:', err);
  process.exit(1);
});
