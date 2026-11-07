/**
 * Smart Location Search (KD-Tree on 3D Unit Sphere)
 * Builds a balanced 3D spatial search tree using unit-sphere Cartesian coordinates (x, y, z).
 * Unit-sphere chord distance is strictly monotonic with great-circle Haversine distance,
 * enabling rigorous 3D bounding-box branch pruning and guaranteeing exact nearest-neighbor results.
 */

const { toUnitSphere, chordDistanceSq, haversineDistance } = require('../utils/geo');
const { MaxHeap } = require('./minHeap');

class KDNode {
  constructor(worker, point, axis) {
    this.worker = worker; // Worker object
    this.point = point; // [x, y, z]
    this.axis = axis; // 0 for x, 1 for y, 2 for z
    this.left = null;
    this.right = null;
    // 3D bounding box for this entire subtree: [[minX, maxX], [minY, maxY], [minZ, maxZ]]
    this.bbox = [
      [point[0], point[0]],
      [point[1], point[1]],
      [point[2], point[2]],
    ];
    // Skills present in this subtree (Set)
    this.skills = new Set([worker.skill.toLowerCase()]);
  }
}

/**
 * Builds a balanced 3D KD-Tree from a list of worker items
 */
function buildKDTree(workers, depth = 0) {
  if (!workers || workers.length === 0) return null;

  const axis = depth % 3;

  // Sort workers along current axis
  workers.sort((a, b) => a.point[axis] - b.point[axis]);

  const mid = Math.floor(workers.length / 2);
  const midItem = workers[mid];

  const node = new KDNode(midItem.worker, midItem.point, axis);

  const leftWorkers = workers.slice(0, mid);
  const rightWorkers = workers.slice(mid + 1);

  node.left = buildKDTree(leftWorkers, depth + 1);
  node.right = buildKDTree(rightWorkers, depth + 1);

  // Expand bounding box and aggregate skills from children
  for (const child of [node.left, node.right]) {
    if (child) {
      for (let i = 0; i < 3; i++) {
        node.bbox[i][0] = Math.min(node.bbox[i][0], child.bbox[i][0]);
        node.bbox[i][1] = Math.max(node.bbox[i][1], child.bbox[i][1]);
      }
      for (const s of child.skills) {
        node.skills.add(s);
      }
    }
  }

  return node;
}

/**
 * Computes minimum squared Euclidean distance from 3D query point Q to a 3D bounding box
 */
function minBoxDistSq(q, bbox) {
  let distSq = 0;
  for (let i = 0; i < 3; i++) {
    const val = q[i];
    const min = bbox[i][0];
    const max = bbox[i][1];
    if (val < min) {
      const diff = min - val;
      distSq += diff * diff;
    } else if (val > max) {
      const diff = val - max;
      distSq += diff * diff;
    }
  }
  return distSq;
}

/**
 * Prepares worker array into unit-sphere format for KD-tree building
 */
function prepareWorkersForKDTree(workers) {
  return workers
    .filter((w) => w.available === 1 || w.available === true)
    .map((w) => {
      const p = toUnitSphere(w.lat, w.lng);
      return {
        worker: w,
        point: [p.x, p.y, p.z],
      };
    });
}

/**
 * Performs K-Nearest-Neighbor search on the 3D unit sphere KD-tree
 * @param {KDNode} root KD-Tree root
 * @param {number} lat Customer latitude
 * @param {number} lng Customer longitude
 * @param {string} skill Requested service
 * @param {number} k Number of results
 * @param {number} totalWorkersCount Total workers in system for stats
 * @returns {Object} { results, stats }
 */
function kdTreeSearch(root, lat, lng, skill, k = 3, totalWorkersCount = 0) {
  const startTime = performance.now();
  const normalizedSkill = skill ? skill.trim().toLowerCase() : '';

  if (!root || k <= 0) {
    return {
      results: [],
      stats: {
        executionTimeMs: Number((performance.now() - startTime).toFixed(3)),
        candidatesExamined: 0,
        totalWorkers: totalWorkersCount,
        matchingWorkers: 0,
        returnedWorkers: 0,
      },
    };
  }

  const querySphere = toUnitSphere(lat, lng);
  const q = [querySphere.x, querySphere.y, querySphere.z];

  // Max-Heap keyed by chordSq, tie-breaking on worker.id
  // Max-Heap allows us to keep the smallest K elements; the root of max-heap is the worst of the top K
  const heap = new MaxHeap((item) => item.chordSq);

  let candidatesExamined = 0;
  let matchingWorkersCount = 0;

  function search(node) {
    if (!node) return;

    // Prune subtree if it doesn't contain requested skill
    if (normalizedSkill && !node.skills.has(normalizedSkill)) {
      return;
    }

    // Prune subtree if minimum possible chord distance to bounding box cannot beat worst in heap
    if (heap.size() === k) {
      const boxDist = minBoxDistSq(q, node.bbox);
      const worstChordSq = heap.peek().chordSq;
      if (boxDist > worstChordSq || Math.abs(boxDist - worstChordSq) < 1e-12) {
        return;
      }
    }

    const worker = node.worker;
    const isAvail = worker.available === 1 || worker.available === true;
    const matchesSkill = !normalizedSkill || worker.skill.toLowerCase() === normalizedSkill;

    if (isAvail && matchesSkill) {
      matchingWorkersCount++;
      candidatesExamined++;

      const dx = q[0] - node.point[0];
      const dy = q[1] - node.point[1];
      const dz = q[2] - node.point[2];
      const chordSq = dx * dx + dy * dy + dz * dz;

      const candidate = {
        worker,
        chordSq,
        id: worker.id,
      };

      if (heap.size() < k) {
        heap.push(candidate);
      } else {
        const worst = heap.peek();
        const diff = chordSq - worst.chordSq;
        // Candidate is strictly better, or equal chord with lower ID
        if (diff < -1e-12 || (Math.abs(diff) <= 1e-12 && worker.id < worst.id)) {
          heap.pop();
          heap.push(candidate);
        }
      }
    }

    const axis = node.axis;
    const diff = q[axis] - node.point[axis];

    // Determine near and far children
    const nearChild = diff <= 0 ? node.left : node.right;
    const farChild = diff <= 0 ? node.right : node.left;

    // Always visit near child first
    if (nearChild) {
      search(nearChild);
    }

    // Check if far child must be visited
    if (farChild) {
      let canContainBetter = true;
      if (heap.size() === k) {
        const worstChordSq = heap.peek().chordSq;
        // Hyperplane distance lower bound: (q[axis] - node.point[axis])^2
        const planeDistSq = diff * diff;
        if (planeDistSq > worstChordSq) {
          canContainBetter = false;
        } else {
          // Tight box check
          const farBoxDist = minBoxDistSq(q, farChild.bbox);
          if (farBoxDist > worstChordSq) {
            canContainBetter = false;
          }
        }
      }

      if (canContainBetter) {
        search(farChild);
      }
    }
  }

  search(root);

  // Extract results from heap and sort in ascending distance order
  const rawResults = [];
  while (!heap.isEmpty()) {
    rawResults.push(heap.pop());
  }

  // Calculate exact Haversine distance and sort ascending
  const formattedResults = rawResults.map((item) => {
    const w = item.worker;
    const dist = haversineDistance(lat, lng, w.lat, w.lng);
    return {
      id: w.id,
      name: w.name,
      skill: w.skill,
      lat: w.lat,
      lng: w.lng,
      rating: Number(w.rating),
      available: w.available === 1 || w.available === true,
      distanceKm: Number(dist.toFixed(3)),
      _distRaw: dist,
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
      totalWorkers: totalWorkersCount,
      matchingWorkers: matchingWorkersCount,
      returnedWorkers: topK.length,
    },
  };
}

module.exports = {
  KDNode,
  buildKDTree,
  prepareWorkersForKDTree,
  kdTreeSearch,
};

