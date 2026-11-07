/**
 * Synthetic City Graph for ALLIN Routing Engine
 * Creates a 50x50 grid graph (2,500 nodes) with realistic road speeds and guaranteed connectivity.
 * Adjacency list representation with geographic snapping.
 */

const { haversineDistance } = require('../utils/geo');

const MAX_SPEED_KM_PER_HOUR = 60.0;
const MAX_SPEED_KM_PER_MIN = MAX_SPEED_KM_PER_HOUR / 60.0; // 1.0 km/min

class CityGraph {
  constructor(options = {}) {
    this.rows = options.rows || 50;
    this.cols = options.cols || 50;
    this.centerLat = options.centerLat || 16.3067;
    this.centerLng = options.centerLng || 80.4365;
    this.stepLat = options.stepLat || 0.0035; // ~390m
    this.stepLng = options.stepLng || 0.0037; // ~390m
    this.seed = options.seed || 42;

    this.nodes = []; // Array of { id, lat, lng, row, col }
    this.adjacency = new Map(); // id -> Array of { targetId, weight, distKm, speedKmh }

    this._generateGraph();
  }

  _createPrng(seed) {
    let s = (seed || 42) >>> 0;
    return function () {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  _generateGraph() {
    const prng = this._createPrng(this.seed);
    const totalNodes = this.rows * this.cols;

    this.minLat = this.centerLat - (this.rows / 2) * this.stepLat;
    this.maxLat = this.centerLat + (this.rows / 2) * this.stepLat;
    this.minLng = this.centerLng - (this.cols / 2) * this.stepLng;
    this.maxLng = this.centerLng + (this.cols / 2) * this.stepLng;

    // 1. Generate nodes
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const id = r * this.cols + c;
        const lat = this.centerLat + (r - (this.rows - 1) / 2) * this.stepLat;
        const lng = this.centerLng + (c - (this.cols - 1) / 2) * this.stepLng;
        this.nodes[id] = { id, lat, lng, row: r, col: c };
        this.adjacency.set(id, []);
      }
    }

    // 2. Generate spanning tree using randomized BFS/Prim to guarantee 100% connectivity
    const inTree = new Uint8Array(totalNodes);
    const treeEdges = new Set();

    const startNode = 0;
    inTree[startNode] = 1;

    // Potential frontier edges: [u, v]
    const frontier = [];
    const addFrontier = (u) => {
      const ur = Math.floor(u / this.cols);
      const uc = u % this.cols;
      const neighbors = [
        [ur - 1, uc],
        [ur + 1, uc],
        [ur, uc - 1],
        [ur, uc + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const v = nr * this.cols + nc;
          if (!inTree[v]) {
            frontier.push([u, v]);
          }
        }
      }
    };

    addFrontier(startNode);

    let treeCount = 1;
    while (frontier.length > 0 && treeCount < totalNodes) {
      // Pick random frontier edge
      const idx = Math.floor(prng() * frontier.length);
      const [u, v] = frontier[idx];
      frontier[idx] = frontier[frontier.length - 1];
      frontier.pop();

      if (!inTree[v]) {
        inTree[v] = 1;
        treeCount++;
        const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
        treeEdges.add(edgeKey);
        this._addEdge(u, v, prng);
        addFrontier(v);
      }
    }

    // 3. Add additional horizontal, vertical and diagonal edges for realistic road network
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const u = r * this.cols + c;

        // Horizontal neighbor
        if (c + 1 < this.cols) {
          const v = r * this.cols + (c + 1);
          const edgeKey = `${u}-${v}`;
          if (!treeEdges.has(edgeKey) && prng() < 0.45) {
            this._addEdge(u, v, prng);
          }
        }

        // Vertical neighbor
        if (r + 1 < this.rows) {
          const v = (r + 1) * this.cols + c;
          const edgeKey = `${u}-${v}`;
          if (!treeEdges.has(edgeKey) && prng() < 0.45) {
            this._addEdge(u, v, prng);
          }
        }

        // Diagonal avenue (occasional diagonal shortcuts)
        if (r + 1 < this.rows && c + 1 < this.cols) {
          const v = (r + 1) * this.cols + (c + 1);
          const edgeKey = `${u}-${v}`;
          if (!treeEdges.has(edgeKey) && prng() < 0.15) {
            this._addEdge(u, v, prng);
          }
        }
      }
    }
  }

  _addEdge(u, v, prng) {
    const nodeU = this.nodes[u];
    const nodeV = this.nodes[v];

    const distKm = haversineDistance(nodeU.lat, nodeU.lng, nodeV.lat, nodeV.lng);

    // Realistic road speed between 30 km/h and 60 km/h
    // Main avenues get 50-60 km/h, local streets get 30-45 km/h
    const speedKmh = 30.0 + prng() * (MAX_SPEED_KM_PER_HOUR - 30.0);

    // Travel time in minutes: distKm / (speedKmh / 60)
    // Note: since speedKmh <= MAX_SPEED_KM_PER_HOUR (60),
    // weight >= distKm / (60 / 60) = distKm minutes.
    // This strictly preserves the admissibility of the A* Haversine heuristic!
    const weight = (distKm / speedKmh) * 60.0;

    this.adjacency.get(u).push({ targetId: v, weight, distKm, speedKmh });
    this.adjacency.get(v).push({ targetId: u, weight, distKm, speedKmh });
  }

  /**
   * Snaps a geographic coordinate to the closest graph node
   */
  snapToNearestNode(lat, lng) {
    // Fast O(1) estimate of grid row and col
    const approxR = Math.round((lat - this.centerLat) / this.stepLat + (this.rows - 1) / 2);
    const approxC = Math.round((lng - this.centerLng) / this.stepLng + (this.cols - 1) / 2);

    let bestNode = null;
    let bestDist = Infinity;

    // Check bounded local window around approx cell
    const windowSize = 3;
    const minR = Math.max(0, approxR - windowSize);
    const maxR = Math.min(this.rows - 1, approxR + windowSize);
    const minC = Math.max(0, approxC - windowSize);
    const maxC = Math.min(this.cols - 1, approxC + windowSize);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const id = r * this.cols + c;
        const node = this.nodes[id];
        const dist = haversineDistance(lat, lng, node.lat, node.lng);
        if (dist < bestDist) {
          bestDist = dist;
          bestNode = node;
        }
      }
    }

    // Fallback if coordinate is far outside the grid
    if (!bestNode) {
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        const dist = haversineDistance(lat, lng, node.lat, node.lng);
        if (dist < bestDist) {
          bestDist = dist;
          bestNode = node;
        }
      }
    }

    return bestNode;
  }
}

let defaultCityGraphInstance = null;

function getCityGraph(options) {
  if (!defaultCityGraphInstance || options) {
    defaultCityGraphInstance = new CityGraph(options);
  }
  return defaultCityGraphInstance;
}

module.exports = {
  CityGraph,
  getCityGraph,
  MAX_SPEED_KM_PER_HOUR,
  MAX_SPEED_KM_PER_MIN,
};

