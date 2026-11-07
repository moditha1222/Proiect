/**
 * Benchmark Service for ALLIN
 * Measures real-world execution times and candidates examined for:
 * 1. Nearest Worker Search (Naive, KD-Tree, Geohash) across varying dataset sizes
 * 2. Shortest Path Routing (Dijkstra vs A*) on the synthetic city graph
 */

const { generateDeterministicWorkers, createPrng, SKILLS } = require('./seedService');
const { naiveSearch } = require('../algorithms/naiveSearch');
const { buildKDTree, prepareWorkersForKDTree, kdTreeSearch } = require('../algorithms/kdTree');
const { buildGeohashIndex, geohashSearch } = require('../algorithms/geohash');
const { getCityGraph } = require('../graph/cityGraph');
const { dijkstra } = require('../algorithms/dijkstra');
const { astar } = require('../algorithms/astar');

function runNearestWorkerBenchmark(sizes = [100, 1000, 10000, 50000], numQueries = 5) {
  const centerLat = Number(process.env.CITY_CENTER_LAT) || 16.3067;
  const centerLng = Number(process.env.CITY_CENTER_LNG) || 80.4365;
  const results = [];

  const queryPrng = createPrng(99999);

  for (const size of sizes) {
    // Generate deterministic dataset for this size
    const workers = generateDeterministicWorkers(size, 12345 + size, centerLat, centerLng);

    // Measure index construction times
    const kdBuildStart = performance.now();
    const kdPrepared = prepareWorkersForKDTree(workers);
    const kdRoot = buildKDTree(kdPrepared);
    const kdBuildTimeMs = Number((performance.now() - kdBuildStart).toFixed(2));

    const geoBuildStart = performance.now();
    const geoIndex = buildGeohashIndex(workers, 6);
    const geoBuildTimeMs = Number((performance.now() - geoBuildStart).toFixed(2));

    // Generate random test queries around the city center
    const testQueries = [];
    for (let q = 0; q < numQueries; q++) {
      const qAngle = queryPrng() * 2 * Math.PI;
      const qR = Math.sqrt(queryPrng()) * 0.07;
      testQueries.push({
        lat: Number((centerLat + qR * Math.sin(qAngle)).toFixed(6)),
        lng: Number((centerLng + qR * Math.cos(qAngle)).toFixed(6)),
        skill: SKILLS[Math.floor(queryPrng() * SKILLS.length)],
        k: 3,
      });
    }

    // Warm-up JIT
    for (let i = 0; i < 2; i++) {
      const tq = testQueries[0];
      naiveSearch(workers, tq.lat, tq.lng, tq.skill, tq.k);
      kdTreeSearch(kdRoot, tq.lat, tq.lng, tq.skill, tq.k, size);
      geohashSearch(geoIndex, tq.lat, tq.lng, tq.skill, tq.k);
    }

    // Measure Naive Search
    let naiveTotalTime = 0;
    let naiveTotalCandidates = 0;
    for (const q of testQueries) {
      const t0 = performance.now();
      const res = naiveSearch(workers, q.lat, q.lng, q.skill, q.k);
      naiveTotalTime += performance.now() - t0;
      naiveTotalCandidates += res.stats.candidatesExamined;
    }

    // Measure KD-Tree Search
    let kdTotalTime = 0;
    let kdTotalCandidates = 0;
    for (const q of testQueries) {
      const t0 = performance.now();
      const res = kdTreeSearch(kdRoot, q.lat, q.lng, q.skill, q.k, size);
      kdTotalTime += performance.now() - t0;
      kdTotalCandidates += res.stats.candidatesExamined;
    }

    // Measure Geohash Search
    let geoTotalTime = 0;
    let geoTotalCandidates = 0;
    for (const q of testQueries) {
      const t0 = performance.now();
      const res = geohashSearch(geoIndex, q.lat, q.lng, q.skill, q.k);
      geoTotalTime += performance.now() - t0;
      geoTotalCandidates += res.stats.candidatesExamined;
    }

    results.push({
      size,
      label: size >= 1000 ? `${size / 1000}K` : `${size}`,
      naiveTimeMs: Number((naiveTotalTime / numQueries).toFixed(3)),
      kdTreeTimeMs: Number((kdTotalTime / numQueries).toFixed(3)),
      geohashTimeMs: Number((geoTotalTime / numQueries).toFixed(3)),
      naiveCandidates: Math.round(naiveTotalCandidates / numQueries),
      kdTreeCandidates: Math.round(kdTotalCandidates / numQueries),
      geohashCandidates: Math.round(geoTotalCandidates / numQueries),
      buildTimes: {
        kdTreeMs: kdBuildTimeMs,
        geohashMs: geoBuildTimeMs,
      },
    });
  }

  return results;
}

function runRoutingBenchmark(numPairs = 5) {
  const graph = getCityGraph();
  const totalNodes = graph.nodes.length;
  const prng = createPrng(77777);

  const pairs = [];
  for (let i = 0; i < numPairs; i++) {
    const start = Math.floor(prng() * totalNodes);
    let target = Math.floor(prng() * totalNodes);
    while (target === start) {
      target = Math.floor(prng() * totalNodes);
    }
    pairs.push({ start, target });
  }

  // Warmup
  dijkstra(graph, pairs[0].start, pairs[0].target);
  astar(graph, pairs[0].start, pairs[0].target);

  const routeResults = [];

  for (let i = 0; i < pairs.length; i++) {
    const { start, target } = pairs[i];
    const dRes = dijkstra(graph, start, target);
    const aRes = astar(graph, start, target);

    routeResults.push({
      queryIndex: i + 1,
      startNodeId: start,
      targetNodeId: target,
      dijkstraNodesExplored: dRes.stats.nodesExplored,
      astarNodesExplored: aRes.stats.nodesExplored,
      dijkstraTimeMs: dRes.stats.executionTimeMs,
      astarTimeMs: aRes.stats.executionTimeMs,
      equalCost: Math.abs(dRes.etaMinutes - aRes.etaMinutes) < 0.01,
      dijkstraEta: dRes.etaMinutes,
      astarEta: aRes.etaMinutes,
    });
  }

  // Compute averages
  const avgDijkstraNodes = Math.round(
    routeResults.reduce((s, r) => s + r.dijkstraNodesExplored, 0) / routeResults.length
  );
  const avgAstarNodes = Math.round(
    routeResults.reduce((s, r) => s + r.astarNodesExplored, 0) / routeResults.length
  );
  const avgDijkstraTime = Number(
    (routeResults.reduce((s, r) => s + r.dijkstraTimeMs, 0) / routeResults.length).toFixed(3)
  );
  const avgAstarTime = Number(
    (routeResults.reduce((s, r) => s + r.astarTimeMs, 0) / routeResults.length).toFixed(3)
  );

  return {
    pairs: routeResults,
    averages: {
      dijkstraNodesExplored: avgDijkstraNodes,
      astarNodesExplored: avgAstarNodes,
      dijkstraTimeMs: avgDijkstraTime,
      astarTimeMs: avgAstarTime,
      reductionPercent: Number(
        (((avgDijkstraNodes - avgAstarNodes) / avgDijkstraNodes) * 100).toFixed(1)
      ),
    },
  };
}

module.exports = {
  runNearestWorkerBenchmark,
  runRoutingBenchmark,
};

