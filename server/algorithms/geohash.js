/**
 * Area-Based Search (Geohash Spatial Grid)
 * Fully custom Geohash implementation with Base32 encoding/decoding,
 * priority-queue cell expansion, and exact lower-bound stopping condition.
 */

const { haversineDistance, minDistToBoundingBox } = require('../utils/geo');
const { MinHeap, MaxHeap } = require('./minHeap');

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BITS = [16, 8, 4, 2, 1];

/**
 * Encodes latitude and longitude into standard Geohash string
 */
function encodeGeohash(lat, lng, precision = 6) {
  let minLat = -90.0;
  let maxLat = 90.0;
  let minLng = -180.0;
  let maxLng = 180.0;

  let hash = '';
  let isLng = true;
  let ch = 0;
  let bit = 0;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= BITS[bit];
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= BITS[bit];
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isLng = !isLng;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Decodes Geohash string into its bounding box:
 * { minLat, maxLat, minLng, maxLng, centerLat, centerLng }
 */
function decodeGeohashBbox(hash) {
  let minLat = -90.0;
  let maxLat = 90.0;
  let minLng = -180.0;
  let maxLng = 180.0;
  let isLng = true;

  for (let i = 0; i < hash.length; i++) {
    const charIndex = BASE32.indexOf(hash[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid geohash character: ${hash[i]}`);
    }

    for (let bit = 0; bit < 5; bit++) {
      const mask = BITS[bit];
      if (isLng) {
        const mid = (minLng + maxLng) / 2;
        if ((charIndex & mask) !== 0) {
          minLng = mid;
        } else {
          maxLng = mid;
        }
      } else {
        const mid = (minLat + maxLat) / 2;
        if ((charIndex & mask) !== 0) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isLng = !isLng;
    }
  }

  return {
    minLat,
    maxLat,
    minLng,
    maxLng,
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
  };
}

/**
 * Gets 8 neighboring geohashes for a given cell
 */
function getGeohashNeighbors(hash) {
  const bbox = decodeGeohashBbox(hash);
  const dLat = bbox.maxLat - bbox.minLat;
  const dLng = bbox.maxLng - bbox.minLng;
  const precision = hash.length;

  const neighbors = [];
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (const [dy, dx] of offsets) {
    const lat = bbox.centerLat + dy * dLat;
    const lng = bbox.centerLng + dx * dLng;
    // Keep in valid geographic range
    const clampedLat = Math.max(-89.99, Math.min(89.99, lat));
    let wrappedLng = lng;
    if (wrappedLng > 180) wrappedLng -= 360;
    if (wrappedLng < -180) wrappedLng += 360;

    neighbors.push(encodeGeohash(clampedLat, wrappedLng, precision));
  }

  return neighbors;
}

/**
 * Builds Geohash spatial index from a list of workers
 */
function buildGeohashIndex(workers, precision = 6) {
  const grid = new Map();
  const skillCounts = new Map();
  let totalAvailable = 0;

  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    if (w.available === 1 || w.available === true) {
      totalAvailable++;
      const s = w.skill ? w.skill.toLowerCase() : '';
      skillCounts.set(s, (skillCounts.get(s) || 0) + 1);

      const hash = encodeGeohash(w.lat, w.lng, precision);
      let list = grid.get(hash);
      if (!list) {
        list = [];
        grid.set(hash, list);
      }
      list.push(w);
    }
  }

  return {
    grid,
    precision,
    totalWorkers: workers.length,
    totalAvailable,
    skillCounts,
  };
}

/**
 * Progressive Area-Based search using Geohash cells and exact bounding box lower-bounds
 */
function geohashSearch(index, lat, lng, skill, k = 3) {
  const startTime = performance.now();
  const normalizedSkill = skill ? skill.trim().toLowerCase() : '';
  const { grid, precision, totalWorkers, skillCounts, totalAvailable } = index;

  const maxPossible = normalizedSkill
    ? (skillCounts ? skillCounts.get(normalizedSkill) || 0 : 0)
    : (totalAvailable || 0);

  const targetK = Math.min(k, maxPossible);

  if (targetK <= 0) {
    return {
      results: [],
      stats: {
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        candidatesExamined: 0,
        totalWorkers: totalWorkers || 0,
        matchingWorkers: 0,
        returnedWorkers: 0,
      },
    };
  }

  const startHash = encodeGeohash(lat, lng, precision);
  const startBbox = decodeGeohashBbox(startHash);
  const startMinDist = minDistToBoundingBox(lat, lng, startBbox);

  // Min-Heap of cells to visit, sorted by minimum possible distance from query to cell bbox
  const cellQueue = new MinHeap((c) => c.minDist);
  const visitedCells = new Set();

  cellQueue.push({
    hash: startHash,
    bbox: startBbox,
    minDist: startMinDist,
  });
  visitedCells.add(startHash);

  // Max-Heap of best workers found so far
  const bestWorkers = new MaxHeap((item) => item.distKm);

  let candidatesExamined = 0;
  let matchingWorkersCount = 0;

  while (!cellQueue.isEmpty()) {
    const currentCell = cellQueue.pop();

    // STOPPING CONDITION:
    // If we have collected at least targetK results and the nearest possible point in this cell
    // is further than our current targetK-th best worker, then NO remaining or future cell can beat it!
    if (bestWorkers.size() >= targetK) {
      const worstDist = bestWorkers.peek().distKm;
      if (currentCell.minDist > worstDist || Math.abs(currentCell.minDist - worstDist) < 1e-9) {
        break;
      }
    }

    // Process workers in current cell
    const cellWorkers = grid.get(currentCell.hash);
    if (cellWorkers && cellWorkers.length > 0) {
      for (let i = 0; i < cellWorkers.length; i++) {
        const w = cellWorkers[i];
        const isAvail = w.available === 1 || w.available === true;
        const matchesSkill = !normalizedSkill || (w.skill && w.skill.toLowerCase() === normalizedSkill);

        if (isAvail && matchesSkill) {
          matchingWorkersCount++;
          candidatesExamined++;
          const dist = haversineDistance(lat, lng, w.lat, w.lng);

          const candidate = {
            worker: w,
            distKm: dist,
            id: w.id,
          };

          if (bestWorkers.size() < targetK) {
            bestWorkers.push(candidate);
          } else {
            const worst = bestWorkers.peek();
            const diff = dist - worst.distKm;
            if (diff < -1e-9 || (Math.abs(diff) <= 1e-9 && w.id < worst.id)) {
              bestWorkers.pop();
              bestWorkers.push(candidate);
            }
          }
        }
      }
    }

    // Expand neighbors
    const neighbors = getGeohashNeighbors(currentCell.hash);
    for (const neighborHash of neighbors) {
      if (!visitedCells.has(neighborHash)) {
        visitedCells.add(neighborHash);
        const nBbox = decodeGeohashBbox(neighborHash);
        const nMinDist = minDistToBoundingBox(lat, lng, nBbox);

        // Only enqueue if it could potentially improve upon our top targetK
        if (bestWorkers.size() < targetK || nMinDist <= bestWorkers.peek().distKm + 1e-9) {
          cellQueue.push({
            hash: neighborHash,
            bbox: nBbox,
            minDist: nMinDist,
          });
        }
      }
    }
  }

  // Extract from heap and sort in ascending order
  const rawResults = [];
  while (!bestWorkers.isEmpty()) {
    rawResults.push(bestWorkers.pop());
  }

  const formattedResults = rawResults.map((item) => {
    const w = item.worker;
    return {
      id: w.id,
      name: w.name,
      skill: w.skill,
      lat: w.lat,
      lng: w.lng,
      rating: Number(w.rating),
      available: w.available === 1 || w.available === true,
      distanceKm: Number(item.distKm.toFixed(3)),
      _distRaw: item.distKm,
    };
  });

  formattedResults.sort((a, b) => {
    const d = a._distRaw - b._distRaw;
    if (Math.abs(d) > 1e-9) return d;
    return a.id - b.id;
  });

  const topK = formattedResults.map((item) => {
    const { _distRaw, ...cleanItem } = item;
    return cleanItem;
  });

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    results: topK,
    stats: {
      executionTimeMs,
      candidatesExamined,
      totalWorkers: totalWorkers || 0,
      matchingWorkers: matchingWorkersCount,
      returnedWorkers: topK.length,
    },
  };
}

module.exports = {
  encodeGeohash,
  decodeGeohashBbox,
  getGeohashNeighbors,
  buildGeohashIndex,
  geohashSearch,
};
