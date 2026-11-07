const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log('--- Starting Production Client Preview (Port 4173) ---');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '../client'),
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    preview.stdout.on('data', (d) => {
      const text = d.toString();
      process.stdout.write(`[PREVIEW] ${text}`);
      if (text.includes('Local:')) resolve();
    });
    preview.stderr.on('data', (d) => process.stderr.write(`[PREVIEW ERR] ${d}`));
    setTimeout(resolve, 5000); // fallback
  });

  console.log('--- Launching Playwright Chromium ---');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const networkRequests = [];
  const apiCalls = [];
  const consoleErrors = [];

  page.on('request', (req) => {
    const url = req.url();
    networkRequests.push({ url, method: req.method() });
    if (url.includes('/api/')) {
      apiCalls.push({ url, method: req.method() });
      console.log(`[NETWORK API CALL] ${req.method()} ${url}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
      console.error(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  try {
    console.log('\n1. Navigating to Home / Find Workers page (http://127.0.0.1:4173)...');
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Click search button
    console.log('\n2. Testing Worker Search interaction...');
    const searchBtn = await page.$('button.search-btn');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(2000);
      console.log('Search clicked successfully.');
    }

    // Navigate to Compare page
    console.log('\n3. Navigating to Compare Search page (/compare)...');
    await page.goto('http://127.0.0.1:4173/compare', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const compareBtn = await page.$('button.search-btn');
    if (compareBtn) {
      await compareBtn.click();
      await page.waitForTimeout(2500);
      console.log('Compare clicked successfully.');
    }

    // Navigate to Route page
    console.log('\n4. Navigating to Plan Route page (/route)...');
    await page.goto('http://127.0.0.1:4173/route', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const routeBtn = await page.$('button.search-btn');
    if (routeBtn) {
      await routeBtn.click();
      await page.waitForTimeout(2500);
      console.log('Calculate Route clicked successfully.');
    }

    // Navigate to Benchmark page
    console.log('\n5. Navigating to Benchmark page (/benchmark)...');
    await page.goto('http://127.0.0.1:4173/benchmark', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const runBenchBtn = await page.$('button.run-bench-btn');
    if (runBenchBtn) {
      await runBenchBtn.click();
      console.log('Benchmark triggered, waiting for completion...');
      await page.waitForTimeout(7000);
      console.log('Benchmark wait completed.');
    }

    console.log('\n=== AUDIT RESULTS ===');
    console.log(`Total API Requests captured: ${apiCalls.length}`);
    apiCalls.forEach((c) => console.log(`  - [${c.method}] ${c.url}`));

    const localhostApiCalls = apiCalls.filter((c) => c.url.includes('localhost:') || c.url.includes('127.0.0.1:'));
    console.log(`Localhost API calls count: ${localhostApiCalls.length}`);

    const renderApiCalls = apiCalls.filter((c) => c.url.startsWith('https://proiect-1.onrender.com/api/'));
    console.log(`Render production backend API calls count: ${renderApiCalls.length}`);

    console.log(`Console errors count: ${consoleErrors.length}`);
  } finally {
    await browser.close();
    preview.kill();
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
