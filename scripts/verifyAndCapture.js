/**
 * Browser verification and screenshot capture script for ALLIN
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  const screenshotsDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching Chromium with --no-sandbox...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  // 1. PAGE ONE: Map & Find Nearby Workers
  console.log('1. Verifying Page 1: Find Nearby Workers (/)...');
  await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  await page.waitForSelector('.map-container', { timeout: 10000 });
  await page.waitForSelector('.search-controls-bar', { timeout: 10000 });

  const mapScreenshotPath = path.join(screenshotsDir, '1-map-page.png');
  await page.screenshot({ path: mapScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${mapScreenshotPath}`);

  // 2. PAGE TWO: Algorithm Comparison
  console.log('2. Verifying Page 2: Algorithm Comparison (/compare)...');
  await page.goto('http://localhost:5000/compare', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  await page.waitForSelector('.comparison-grid', { timeout: 10000 });
  await page.waitForSelector('.comparison-table', { timeout: 10000 });

  // Click first accordion to expand explanation
  const accordionHeader = await page.$('.accordion-header');
  if (accordionHeader) {
    await accordionHeader.click();
    await page.waitForTimeout(500);
  }

  // Ensure scroll is at top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const compareScreenshotPath = path.join(screenshotsDir, '2-comparison-page.png');
  await page.screenshot({ path: compareScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${compareScreenshotPath}`);

  // 3. PAGE THREE: Route Planning
  console.log('3. Verifying Page 3: Route Planning (/route)...');
  await page.goto('http://localhost:5000/route', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  await page.waitForSelector('.map-container', { timeout: 10000 });
  // Enable side-by-side comparison mode
  const compareCheckbox = await page.$('input[type="checkbox"]');
  if (compareCheckbox) {
    await compareCheckbox.click();
    await page.waitForTimeout(1500);
  }

  const routeScreenshotPath = path.join(screenshotsDir, '3-route-page.png');
  await page.screenshot({ path: routeScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${routeScreenshotPath}`);

  // 4. PAGE FOUR: Performance Benchmark
  console.log('4. Verifying Page 4: Performance Benchmark (/benchmark)...');
  await page.goto('http://localhost:5000/benchmark', { waitUntil: 'domcontentloaded' });
  // Allow benchmark queries to execute
  await page.waitForTimeout(3500);

  // Toggle Log Scale
  const logScaleBtn = await page.$('button.toggle-btn:text("Log Scale")');
  if (logScaleBtn) {
    await logScaleBtn.click();
    await page.waitForTimeout(800);
  }

  const benchmarkScreenshotPath = path.join(screenshotsDir, '4-benchmark-page.png');
  await page.screenshot({ path: benchmarkScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${benchmarkScreenshotPath}`);

  // 5. MOBILE LAYOUT VERIFICATION (390 x 844)
  console.log('5. Verifying Mobile Layout (390 x 844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(2000);

  const mobileScreenshotPath = path.join(screenshotsDir, '5-mobile-layout.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${mobileScreenshotPath}`);

  await browser.close();
  console.log('SUCCESS: All browser verifications and screenshots captured!');
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
