/**
 * Search Algorithm Comparison Route for ALLIN
 * Runs Naive Linear Search, KD-Tree, and Geohash Grid simultaneously
 * on the exact same inputs and reports verified consistency and detailed performance metrics.
 */

const express = require('express');
const router = express.Router();
const spatialIndexManager = require('../services/spatialIndexManager');
const { validateNearestParams } = require('../utils/validation');

/**
 * GET /api/compare
 * Query: lat, lng, skill, k
 */
router.get('/', (req, res) => {
  // Validate with dummy algorithm since compare runs all three
  const validation = validateNearestParams({ ...req.query, algo: 'kdtree' });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { lat, lng, skill, k } = validation.data;

  try {
    const comparison = spatialIndexManager.compare(lat, lng, skill, k);
    return res.json(comparison);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

