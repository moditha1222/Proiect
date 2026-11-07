/**
 * Database Seeding Route for ALLIN
 * Generates and persists deterministic worker datasets
 */

const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../services/seedService');
const spatialIndexManager = require('../services/spatialIndexManager');
const { validateSeedParams } = require('../utils/validation');

/**
 * POST /api/seed
 * Body: { n: 50, seed: 12345 }
 */
router.post('/', (req, res) => {
  const validation = validateSeedParams(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { n, seed } = validation.data;

  try {
    const workers = seedDatabase(n, seed);
    // Refresh spatial indexes immediately with new dataset
    spatialIndexManager.refresh();

    return res.json({
      success: true,
      message: `Successfully seeded ${workers.length} workers with seed ${seed}.`,
      totalWorkers: workers.length,
      seed,
      preview: workers.slice(0, 5),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

