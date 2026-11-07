/**
 * Performance Benchmark Route for ALLIN
 * Executes empirical performance benchmarks across spatial search and graph routing algorithms
 */

const express = require('express');
const router = express.Router();
const { runNearestWorkerBenchmark, runRoutingBenchmark } = require('../services/benchmarkService');
const { validateBenchmarkParams } = require('../utils/validation');

/**
 * GET /api/benchmark
 * Query: sizes=100,1000,10000,50000&queries=5
 */
router.get('/', (req, res) => {
  const validation = validateBenchmarkParams(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { sizes } = validation.data;
  const numQueries = req.query.queries ? Math.max(1, Math.min(20, parseInt(req.query.queries, 10))) : 5;

  try {
    const searchBenchmark = runNearestWorkerBenchmark(sizes, numQueries);
    const routingBenchmark = runRoutingBenchmark(5);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      config: {
        testedSizes: sizes,
        queriesPerSize: numQueries,
      },
      searchBenchmark,
      routingBenchmark,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

