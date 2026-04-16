const { chromium } = require('playwright-core');
const path = require('path');

const CHROMIUM_PATH = process.env.PW_CHROMIUM_PATH ||
  path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'chromium-1217', 'chrome-win64', 'chrome.exe');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const context = await browser.newContext();
  const page = await context.newPage();

  const firestoreUrls = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('firestore') || url.includes('127.0.0.1:8081') || url.includes('localhost:8081')) {
      firestoreUrls.push(url);
    }
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes("Database '(default)' not found")) {
      console.log('[CONSOLE_ERROR]', text);
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('\n--- Firestore network requests detected ---');
  if (firestoreUrls.length === 0) {
    console.log('None detected (possibly blocked by CORS or using gRPC-Web via fetch).');
  } else {
    firestoreUrls.forEach((u) => console.log(u));
  }

  // Try to detect fetch requests to emulator via page evaluation
  const emulatorDetected = await page.evaluate(() => {
    return (window.__firebaseAppConfig || {}).emulator || false;
  }).catch(() => false);

  console.log('\n--- Emulator flag in page ---');
  console.log(emulatorDetected);

  await browser.close();
})();
