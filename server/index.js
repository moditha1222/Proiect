/**
 * Server Entrypoint for ALLIN Engine
 */

const app = require('./app');
const db = require('./database/db');
const { seedDatabase } = require('./services/seedService');
const spatialIndexManager = require('./services/spatialIndexManager');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function initializeServer() {
  // Check if database already has workers
  const countRow = db.prepare('SELECT COUNT(*) as count FROM workers').get();
  const workerCount = countRow ? countRow.count : 0;

  if (workerCount === 0) {
    const defaultWorkers = Number(process.env.DEFAULT_WORKERS) || 50;
    console.log(`Database is empty. Seeding initial ${defaultWorkers} workers...`);
    seedDatabase(defaultWorkers, 12345);
  } else {
    console.log(`Database contains ${workerCount} existing workers.`);
  }

  // Build spatial indexes
  spatialIndexManager.refresh();
  console.log('Spatial indices (KD-Tree & Geohash) successfully initialized.');

  const server = app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`  ALLIN – Nearest Worker Search & ETA Engine`);
    console.log(`  Backend running on: http://${HOST}:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling for container/production environments
  function handleShutdown(signal) {
    console.log(`\nReceived ${signal}. Gracefully stopping ALLIN server...`);
    server.close(() => {
      try {
        db.close();
        console.log('Database connection closed cleanly.');
      } catch (err) {
        console.error('Error closing SQLite database:', err);
      }
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  initializeServer();
}

module.exports = app;
