/**
 * Server Entrypoint for ALLIN Engine
 * Standalone Node.js Express server configured for Render Web Service deployment.
 */

const app = require('./app');
const db = require('./database/db');
const { seedDatabase } = require('./services/seedService');
const spatialIndexManager = require('./services/spatialIndexManager');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function initializeServer() {
  console.log('----------------------------------------------------');
  console.log('Starting ALLIN Nearest Worker Search & ETA Engine...');
  console.log(`Database storage path: ${db.dbPath}`);

  // Check if database already contains worker data
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM workers').get();
    const workerCount = countRow ? countRow.count : 0;

    if (workerCount === 0) {
      const defaultWorkers = Number(process.env.DEFAULT_WORKERS) || 50;
      console.log(`Database is empty. Seeding initial ${defaultWorkers} workers...`);
      seedDatabase(defaultWorkers, 12345);
    } else {
      console.log(`Persistent database detected: ${workerCount} existing workers loaded.`);
    }
  } catch (err) {
    console.warn('Initial worker count check failed, attempting auto-seed:', err.message);
    seedDatabase(50, 12345);
  }

  // Initialize in-memory spatial indices (3D KD-Tree & Geohash Grid)
  spatialIndexManager.refresh();
  console.log('Spatial indices (3D KD-Tree & Geohash Grid) initialized.');

  const server = app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`  ALLIN Backend Service is LIVE`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log(`  Health Check: http://${HOST}:${PORT}/api/health`);
    console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handlers for Render container signals
  function handleShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully stopping ALLIN backend service...`);
    server.close(() => {
      try {
        db.close();
        console.log('SQLite database closed cleanly.');
      } catch (err) {
        console.error('Error closing SQLite database:', err);
      }
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  return server;
}

if (require.main === module) {
  initializeServer();
}

module.exports = app;
