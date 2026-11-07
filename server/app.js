/**
 * Express Application configuration for ALLIN Backend Engine
 * Configured for standalone Node.js deployment on Render and seamless CORS with Vercel frontend.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database/db');
const workersRouter = require('./routes/workers');
const routeRouter = require('./routes/route');
const compareRouter = require('./routes/compare');
const seedRouter = require('./routes/seed');
const benchmarkRouter = require('./routes/benchmark');
const { SKILLS } = require('./services/seedService');

const app = express();

// ----------------------------------------------------
// CORS Configuration for Production Vercel & Dev
// ----------------------------------------------------
const clientUrlEnv = process.env.CLIENT_URL || '';
const configuredOrigins = clientUrlEnv
  ? clientUrlEnv.split(',').map((u) => u.trim().replace(/\/+$/, ''))
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const allowedOriginsSet = new Set([...defaultOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Render health checks, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow wildcard or exact configured match
      if (
        allowedOriginsSet.has('*') ||
        allowedOriginsSet.has(normalizedOrigin) ||
        configuredOrigins.includes('*')
      ) {
        return callback(null, true);
      }

      // Automatically permit production Vercel frontend and preview branch URLs (*.vercel.app)
      if (
        normalizedOrigin.endsWith('.vercel.app') ||
        configuredOrigins.some((pattern) => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(normalizedOrigin);
          }
          return false;
        })
      ) {
        return callback(null, true);
      }

      // Permissive fallback in development or allow with header
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------
// Health Check Endpoint (Render & Monitoring)
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  let workersCount = 0;
  let dbStatus = 'disconnected';

  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM workers').get();
    workersCount = row ? row.count : 0;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'ALLIN Nearest Worker Search & ETA Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      totalWorkers: workersCount,
      storagePath: db.dbPath || 'configured',
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// App Config & Meta endpoint
app.get('/api/config', (req, res) => {
  res.json({
    cityName: process.env.CITY_NAME || 'Guntur',
    centerLat: Number(process.env.CITY_CENTER_LAT) || 16.3067,
    centerLng: Number(process.env.CITY_CENTER_LNG) || 80.4365,
    defaultWorkers: Number(process.env.DEFAULT_WORKERS) || 50,
    skills: SKILLS,
  });
});

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------
app.use('/api/workers', workersRouter);
app.use('/api/route', routeRouter);
app.use('/api/compare', compareRouter);
app.use('/api/seed', seedRouter);
app.use('/api/benchmark', benchmarkRouter);

// ----------------------------------------------------
// Static Assets (if full-stack deployment)
// ----------------------------------------------------
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// ----------------------------------------------------
// 404 Handler for API & Standalone Backend
// ----------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route Not Found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    service: 'ALLIN Backend API',
    error: `Not Found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/config',
      'GET /api/workers',
      'GET /api/workers/nearest',
      'GET /api/route',
      'GET /api/route/compare',
      'GET /api/compare',
      'POST /api/seed',
      'GET /api/benchmark',
    ],
  });
});

// ----------------------------------------------------
// Global 500 Error Handler
// ----------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});

module.exports = app;
