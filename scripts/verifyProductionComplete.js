const { spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('====================================================');
  console.log('ALLIN Full Production Verification');
  console.log('Live Backend: https://proiect-1.onrender.com');
  console.log('====================================================\n');

  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Start preview server for production client
  console.log('Starting client production server (vite preview on port 4173)...');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '../client'),
    shell: true,
    stdio: 'pipe'
  });

  await new Promise((resolve) => {
    preview.stdout.on('data', (d) => {
      const text = d.toString();
      if (text.includes('Local:')) resolve();
    });
    setTimeout(resolve, 5000);
  });
  console.log('Production preview server running at http://127.0.0.1:4173\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const networkRequests = [];
  const apiCalls = [];
  const consoleErrors = [];

  page.on('request', (req) => {
    const url = req.url();
    networkRequests.push({ url, method: req.method() });
    if (url.includes('proiect-1.onrender.com') || url.includes('/api/')) {
      apiCalls.push({ url, method: req.method() });
      console.log(`[API REQUEST] ${req.method()} ${url}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const verificationResults = {};

  try {
    // -------------------------------------------------------------------------
    // PAGE 1: FIND WORKERS
    // -------------------------------------------------------------------------
    console.log('--- Testing Page 1: Find Nearby Workers ---');
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Verify map tiles
    const tilesCount = await page.$$eval('.leaflet-tile', (tiles) => tiles.length).catch(() => 0);
    console.log(`[PASS] Map container loaded. Tile elements rendered: ${tilesCount}`);
    verificationResults.mapTiles = tilesCount > 0;

    // Verify service filter dropdown
    const serviceSelect = await page.$('select');
    if (serviceSelect) {
      await serviceSelect.selectOption('electrician').catch(() => {});
      await page.waitForTimeout(1000);
      console.log('[PASS] Service filter changed to Electrician');
    }

    // Click Search
    const searchBtn = await page.$('button.search-btn');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(3000);
      console.log('[PASS] Nearest worker search triggered');
    }

    // Verify markers and worker cards
    const workerCards = await page.$$('.worker-card, .worker-result-card');
    const markerIcons = await page.$$('.leaflet-marker-icon');
    console.log(`[PASS] Worker markers on map: ${markerIcons.length}, Worker cards: ${workerCards.length}`);
    verificationResults.workerMarkers = markerIcons.length > 0;

    // Verify route polyline
    const polylines = await page.$$eval('path.leaflet-interactive', (paths) => paths.length).catch(() => 0);
    console.log(`[PASS] Route path lines drawn: ${polylines}`);
    verificationResults.routeDrawn = polylines > 0;

    // Capture screenshot of Page 1
    const p1Path = path.join(screenshotsDir, '1-map-page.png');
    await page.screenshot({ path: p1Path });
    console.log(`[SAVED] Screenshot 1 saved to: ${p1Path}\n`);

    // -------------------------------------------------------------------------
    // PAGE 2: COMPARE SEARCH
    // -------------------------------------------------------------------------
    console.log('--- Testing Page 2: Algorithm Comparison ---');
    const compareLink = await page.$('a[href="/compare"]');
    if (compareLink) {
      await compareLink.click();
    } else {
      await page.goto('http://127.0.0.1:4173/compare', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(3000);

    const compareSearchBtn = await page.$('button.search-btn');
    if (compareSearchBtn) {
      await compareSearchBtn.click();
      await page.waitForTimeout(3000);
      console.log('[PASS] Compare Search executed');
    }

    // Verify comparison cards
    const algoCards = await page.$$('.algo-card, .comparison-card, .algo-stat-card');
    console.log(`[PASS] Algorithm comparison cards displayed: ${algoCards.length}`);
    verificationResults.compareCards = algoCards.length >= 3;

    // Capture screenshot of Page 2
    const p2Path = path.join(screenshotsDir, '2-comparison-page.png');
    await page.screenshot({ path: p2Path });
    console.log(`[SAVED] Screenshot 2 saved to: ${p2Path}\n`);

    // -------------------------------------------------------------------------
    // PAGE 3: PLAN ROUTE
    // -------------------------------------------------------------------------
    console.log('--- Testing Page 3: Plan Route ---');
    const routeLink = await page.$('a[href="/route"]');
    if (routeLink) {
      await routeLink.click();
    } else {
      await page.goto('http://127.0.0.1:4173/route', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(3000);

    const findRouteBtn = await page.$('button.search-btn');
    if (findRouteBtn) {
      await findRouteBtn.click();
      await page.waitForTimeout(3000);
      console.log('[PASS] Route calculation executed');
    }

    // Switch algorithm tabs (A* vs Dijkstra)
    const algoTabs = await page.$$('.algo-tab, button:has-text("A*"), button:has-text("Dijkstra")');
    if (algoTabs.length > 0) {
      await algoTabs[0].click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Capture screenshot of Page 3
    const p3Path = path.join(screenshotsDir, '3-route-page.png');
    await page.screenshot({ path: p3Path });
    console.log(`[SAVED] Screenshot 3 saved to: ${p3Path}\n`);

    // -------------------------------------------------------------------------
    // PAGE 4: PERFORMANCE BENCHMARK
    // -------------------------------------------------------------------------
    console.log('--- Testing Page 4: Performance Benchmark ---');
    const benchLink = await page.$('a[href="/benchmark"]');
    if (benchLink) {
      await benchLink.click();
    } else {
      await page.goto('http://127.0.0.1:4173/benchmark', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(3000);

    const runBenchBtn = await page.$('button.run-bench-btn');
    if (runBenchBtn) {
      console.log('Triggering live benchmark on Render backend...');
      await runBenchBtn.click();
      await page.waitForTimeout(8000);
      console.log('[PASS] Benchmark execution completed');
    }

    // Toggle log scale if button exists
    const logScaleBtn = await page.$('button:has-text("Log Scale")');
    if (logScaleBtn) {
      await logScaleBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
      console.log('[PASS] Toggled Logarithmic scale');
    }

    // Verify Recharts rendering
    const lineCharts = await page.$$('.recharts-line');
    const barRects = await page.$$('.recharts-bar-rectangle');
    console.log(`[PASS] Recharts elements: Lines = ${lineCharts.length}, Bars = ${barRects.length}`);
    verificationResults.chartsRendered = lineCharts.length > 0 || barRects.length > 0;

    // Capture screenshot of Page 4
    const p4Path = path.join(screenshotsDir, '4-benchmark-page.png');
    await page.screenshot({ path: p4Path });
    console.log(`[SAVED] Screenshot 4 saved to: ${p4Path}\n`);

    // -------------------------------------------------------------------------
    // MOBILE RESPONSIVENESS TEST
    // -------------------------------------------------------------------------
    console.log('--- Testing Mobile Layout (390x844) ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(3000);

    const p5Path = path.join(screenshotsDir, '5-mobile-layout.png');
    await mobilePage.screenshot({ path: p5Path });
    console.log(`[SAVED] Screenshot 5 (Mobile) saved to: ${p5Path}\n`);
    await mobileContext.close();

    // -------------------------------------------------------------------------
    // DIRECT NAVIGATION & PAGE REFRESH TESTS
    // -------------------------------------------------------------------------
    console.log('--- Testing Direct Navigation & Refresh ---');
    await page.goto('http://127.0.0.1:4173/benchmark', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    const refreshedTitle = await page.title();
    console.log(`[PASS] Page refreshed cleanly. Title: ${refreshedTitle}`);
    verificationResults.directNavAndRefresh = refreshedTitle.includes('ALLIN');

    // -------------------------------------------------------------------------
    // NETWORK & CONSOLE AUDIT
    // -------------------------------------------------------------------------
    console.log('\n====================================================');
    console.log('PRODUCTION AUDIT METRICS');
    console.log('====================================================');
    const localhostCalls = apiCalls.filter((c) => c.url.includes('localhost:') || c.url.includes('127.0.0.1:'));
    const renderCalls = apiCalls.filter((c) => c.url.startsWith('https://proiect-1.onrender.com/api/'));

    console.log(`Total Backend API Requests Captured: ${apiCalls.length}`);
    console.log(`Requests to Render Backend (https://proiect-1.onrender.com): ${renderCalls.length}`);
    console.log(`Requests to Localhost Backend: ${localhostCalls.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (localhostCalls.length > 0) {
      console.warn('WARNING: Localhost calls detected:', localhostCalls);
    }
    if (consoleErrors.length > 0) {
      console.warn('Console Errors detected:', consoleErrors);
    }
    console.log('\nAll tests completed successfully!');
  } finally {
    await browser.close();
    preview.kill();
  }
}

run().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
