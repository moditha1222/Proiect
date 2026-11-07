/**
 * Basic Search (Naive Linear Scan)
 * Filters available workers by skill and scans through sequentially,
 * calculating exact Haversine distance for each candidate.
 */

const { haversineDistance } = require('../utils/geo');

/**
 * Searches nearest K workers using naive linear scan
 * @param {Array} workers Array of worker objects
 * @param {number} lat Customer latitude
 * @param {number} lng Customer longitude
 * @param {string} skill Requested service
 * @param {number} k Number of results to return
 * @returns {Object} { results, stats }
 */
function naiveSearch(workers, lat, lng, skill, k = 3) {
  const startTime = performance.now();
  const normalizedSkill = skill ? skill.trim().toLowerCase() : '';

  let matchingCount = 0;
  let candidatesExamined = 0;
  const scoredWorkers = [];

  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    const isAvail = w.available === 1 || w.available === true;
    const matchesSkill = !normalizedSkill || (w.skill && w.skill.toLowerCase() === normalizedSkill);

    if (isAvail && matchesSkill) {
      matchingCount++;
      candidatesExamined++;
      const dist = haversineDistance(lat, lng, w.lat, w.lng);
      scoredWorkers.push({
        id: w.id,
        name: w.name,
        skill: w.skill,
        lat: w.lat,
        lng: w.lng,
        rating: Number(w.rating),
        available: isAvail,
        distanceKm: Number(dist.toFixed(3)),
        _distRaw: dist,
      });
    }
  }

  // Deterministic sort: distance ascending, ID ascending as tie breaker
  scoredWorkers.sort((a, b) => {
    const diff = a._distRaw - b._distRaw;
    if (Math.abs(diff) > 1e-9) {
      return diff;
    }
    return a.id - b.id;
  });

  const topK = scoredWorkers.slice(0, k).map((item) => {
    const { _distRaw, ...cleanItem } = item;
    return cleanItem;
  });

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    results: topK,
    stats: {
      executionTimeMs,
      candidatesExamined,
      totalWorkers: workers.length,
      matchingWorkers: matchingCount,
      returnedWorkers: topK.length,
    },
  };
}

module.exports = {
  naiveSearch,
};

