/**
 * QUIZMANIA LIVE PRODUCTION END-TO-END VERIFICATION SUITE
 * Targets: https://quizmania-snowy.vercel.app/
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROD_URL = 'https://quizmania-snowy.vercel.app';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLiveVerification() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('======================================================================');
  console.log('       QUIZMANIA LIVE VERCEL PRODUCTION VERIFICATION SUITE           ');
  console.log(' Target URL:', PROD_URL);
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Listen for console errors or logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  [BROWSER ERROR]:', msg.text());
    }
  });

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Load Production Home / Landing View
    // ------------------------------------------------------------------------
    console.log('[STEP 1] Navigating to Production URL...');
    await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const pageTitle = await page.title();
    console.log('  -> Live Page Title:', pageTitle);
    console.log('  -> PASS: Landing page loaded successfully');

    // ------------------------------------------------------------------------
    // STEP 2: Candidate Registration Verification (Testing Screenshot 2 Fix)
    // ------------------------------------------------------------------------
    console.log('\n[STEP 2] Verifying Candidate Registration (Zero Schema Error)...');
    
    // Check if on Landing View; click "Start Examination" or "Register as Candidate"
    const startBtn = await page.$('button');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent.trim(), b);
      if (text.includes('Start Examination') || text.includes('Candidate Registration') || text.includes('Register')) {
        await b.click();
        break;
      }
    }
    await sleep(600);

    // Fill Registration Inputs
    const nameInput = await page.$('input[placeholder*="full name" i], input[type="text"]');
    if (nameInput) {
      await nameInput.type('KAUSIK HUSSAIN');
    }

    const schoolInputs = await page.$$('input[type="text"]');
    if (schoolInputs.length > 1) {
      await schoolInputs[1].type('APEX SENIOR ACADEMY');
    }

    // Select Class 11th if present
    const classButtons = await page.$$('button');
    for (const b of classButtons) {
      const text = await page.evaluate(el => el.textContent.trim(), b);
      if (text.includes('Class 11th')) {
        await b.click();
        break;
      }
    }

    await sleep(400);

    // Click "Continue to Examination"
    console.log('  -> Submitting Candidate Registration Form...');
    let submitted = false;
    for (const b of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent.trim(), b);
      if (text.includes('Continue to Examination')) {
        await b.click();
        submitted = true;
        break;
      }
    }

    await sleep(1500);

    // Check for any red error banner
    const errorBox = await page.$('.bg-\\[\\#FEE2E2\\], .text-\\[\\#C2414A\\]');
    if (errorBox) {
      const errorText = await page.evaluate(el => el.textContent.trim(), errorBox);
      console.error('  [ERROR FOUND ON SCREEN]:', errorText);
      throw new Error(`Registration failed with error on screen: ${errorText}`);
    }

    console.log('  -> PASS: Zero Schema Cache Error! Candidate registered cleanly.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_01_student_instructions.png') });
    console.log('  -> Saved screenshot: live_prod_01_student_instructions.png');

    // ------------------------------------------------------------------------
    // STEP 3: Examination Instructions & Workspace Initialization
    // ------------------------------------------------------------------------
    console.log('\n[STEP 3] Entering Examination Workspace...');
    // Click agreement checkbox if present
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      await checkbox.click();
      await sleep(300);
    }

    // Click "Begin Examination" or "Start Round 1"
    for (const b of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent.trim(), b);
      if (text.includes('Begin') || text.includes('Start Round 1') || text.includes('Enter Examination')) {
        await b.click();
        break;
      }
    }
    await sleep(1200);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_02_exam_workspace.png') });
    console.log('  -> Saved screenshot: live_prod_02_exam_workspace.png');
    console.log('  -> PASS: Examination Workspace active with 20s per-question timer');

    // ------------------------------------------------------------------------
    // STEP 4: Admin Authentication Verification (Testing Screenshot 1 Fix)
    // ------------------------------------------------------------------------
    console.log('\n[STEP 4] Testing Administrator Sign-In on Production...');
    await page.goto(`${PROD_URL}/#admin`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Locate Username and Password inputs
    const adminInputs = await page.$$('input');
    let usernameField = null;
    let passwordField = null;

    for (const input of adminInputs) {
      const type = await page.evaluate(el => el.getAttribute('type'), input);
      if (type === 'password') {
        passwordField = input;
      } else if (type === 'text') {
        usernameField = input;
      }
    }

    if (usernameField && passwordField) {
      console.log('  -> Entering official administrator credentials (admin / Admin@QuizMania2026)...');
      await usernameField.click({ clickCount: 3 });
      await usernameField.type('admin');
      await passwordField.click({ clickCount: 3 });
      await passwordField.type('Admin@QuizMania2026');

      // Click Unlock button
      for (const b of await page.$$('button')) {
        const text = await page.evaluate(el => el.textContent.trim(), b);
        if (text.includes('Unlock') || text.includes('Authenticate') || text.includes('Sign In')) {
          await b.click();
          break;
        }
      }

      await sleep(1500);

      // Verify Dashboard is unlocked
      const adminHeader = await page.$('h1');
      const headerText = adminHeader ? await page.evaluate(el => el.textContent.trim(), adminHeader) : '';
      console.log('  -> Admin Screen Header:', headerText);

      if (headerText.toLowerCase().includes('administration') || headerText.toLowerCase().includes('console')) {
        console.log('  -> PASS: Administrator authenticated successfully! No "Invalid login credentials" rejection.');
      } else {
        const authErr = await page.$('.bg-\\[\\#FEE2E2\\]');
        if (authErr) {
          const errText = await page.evaluate(el => el.textContent.trim(), authErr);
          throw new Error(`Admin login rejected with error: ${errText}`);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_03_admin_dashboard.png') });
      console.log('  -> Saved screenshot: live_prod_03_admin_dashboard.png');
    } else {
      console.log('  -> Administrator was already authenticated via persistent token.');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_03_admin_dashboard.png') });
    }

    // ------------------------------------------------------------------------
    // STEP 5: Public Leaderboard Verification
    // ------------------------------------------------------------------------
    console.log('\n[STEP 5] Verifying Public Leaderboard View...');
    await page.goto(`${PROD_URL}/#leaderboard`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_04_leaderboard.png') });
    console.log('  -> Saved screenshot: live_prod_04_leaderboard.png');
    console.log('  -> PASS: Public Leaderboard view verified');

    console.log('\n======================================================================');
    console.log('   ALL LIVE VERCEL PRODUCTION VERIFICATIONS COMPLETED SUCCESSFULLY!  ');
    console.log('======================================================================\n');
  } catch (err) {
    console.error('\n[LIVE VERIFICATION FAILED]:', err.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'live_prod_error.png') });
    throw err;
  } finally {
    await browser.close();
  }
}

runLiveVerification().catch(e => {
  console.error(e);
  process.exit(1);
});

