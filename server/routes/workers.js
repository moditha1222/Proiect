/**
 * Workers Route for ALLIN
 * Handles nearest worker searching and worker listing
 */

const express = require('express');
const router = express.Router();
const spatialIndexManager = require('../services/spatialIndexManager');
const { validateNearestParams } = require('../utils/validation');

/**
 * GET /api/workers/nearest
 * Query: lat, lng, skill, k, algo
 */
router.get('/nearest', (req, res) => {
  const validation = validateNearestParams(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { lat, lng, skill, k, algo } = validation.data;

  try {
    const result = spatialIndexManager.search(lat, lng, skill, k, algo);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/workers
 * Returns all workers for map rendering / initial overview
 */
router.get('/', (req, res) => {
  try {
    const workers = spatialIndexManager.getAllWorkers();
    return res.json({
      success: true,
      total: workers.length,
      workers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

