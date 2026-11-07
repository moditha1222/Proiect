/**
 * Route API for ALLIN
 * Handles Dijkstra and A* path calculations on the synthetic city graph
 */

const express = require('express');
const router = express.Router();
const routingService = require('../services/routingService');
const { validateRouteParams } = require('../utils/validation');

/**
 * GET /api/route
 * Query: fromLat, fromLng, toLat, toLng, algo ('dijkstra' | 'astar')
 */
router.get('/', (req, res) => {
  const validation = validateRouteParams(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { fromLat, fromLng, toLat, toLng, algo } = validation.data;

  try {
    const route = routingService.calculateRoute(fromLat, fromLng, toLat, toLng, algo);
    return res.json(route);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/route/compare
 * Query: fromLat, fromLng, toLat, toLng
 * Runs both Dijkstra and A* side-by-side on the exact same points
 */
router.get('/compare', (req, res) => {
  // Validate coordinates with default algo 'astar'
  const validation = validateRouteParams({ ...req.query, algo: 'astar' });
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { fromLat, fromLng, toLat, toLng } = validation.data;

  try {
    const comparison = routingService.compareRoutes(fromLat, fromLng, toLat, toLng);
    return res.json(comparison);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

