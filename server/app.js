/**
 * Express Application configuration for ALLIN
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const workersRouter = require('./routes/workers');
const routeRouter = require('./routes/route');
const compareRouter = require('./routes/compare');
const seedRouter = require('./routes/seed');
const benchmarkRouter = require('./routes/benchmark');
const { SKILLS } = require('./services/seedService');

const app = express();

// Configurable CORS origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, health checks, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ALLIN Engine',
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

// API Routes
app.use('/api/workers', workersRouter);
app.use('/api/route', routeRouter);
app.use('/api/compare', compareRouter);
app.use('/api/seed', seedRouter);
app.use('/api/benchmark', benchmarkRouter);

// Serve static frontend build if present
const path = require('path');
const fs = require('fs');
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

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Not Found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

module.exports = app;
