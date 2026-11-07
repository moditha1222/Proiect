/**
 * Spatial Index Manager for ALLIN
 * Caches in-memory datasets and builds/refreshes KD-Tree and Geohash spatial indices.
 * Provides unified query and comparison execution across all three nearest-neighbor algorithms.
 */

const db = require('../database/db');
const { naiveSearch } = require('../algorithms/naiveSearch');
const { buildKDTree, prepareWorkersForKDTree, kdTreeSearch } = require('../algorithms/kdTree');
const { buildGeohashIndex, geohashSearch } = require('../algorithms/geohash');

class SpatialIndexManager {
  constructor() {
    this.workers = [];
    this.kdTreeRoot = null;
    this.geohashIndex = null;
    this.isInitialized = false;
  }

  /**
   * Loads all workers from SQLite database and rebuilds spatial indexes
   */
  refresh() {
    const rows = db.prepare('SELECT * FROM workers ORDER BY id ASC').all();
    this.workers = rows;

    const kdPrepared = prepareWorkersForKDTree(this.workers);
    this.kdTreeRoot = buildKDTree(kdPrepared);

    this.geohashIndex = buildGeohashIndex(this.workers, 6);
    this.isInitialized = true;
  }

  ensureInitialized() {
    if (!this.isInitialized || this.workers.length === 0) {
      this.refresh();
    }
  }

  getAllWorkers() {
    this.ensureInitialized();
    return this.workers;
  }

  /**
   * Executes nearest search using specified algorithm
   * algo: 'naive' | 'kdtree' | 'geohash'
   */
  search(lat, lng, skill, k = 3, algo = 'kdtree') {
    this.ensureInitialized();

    const normalizedAlgo = (algo || 'kdtree').toLowerCase();

    switch (normalizedAlgo) {
      case 'naive': {
        const response = naiveSearch(this.workers, lat, lng, skill, k);
        return {
          success: true,
          algorithm: 'naive',
          results: response.results,
          stats: response.stats,
        };
      }

      case 'kdtree': {
        const response = kdTreeSearch(
          this.kdTreeRoot,
          lat,
          lng,
          skill,
          k,
          this.workers.length
        );
        return {
          success: true,
          algorithm: 'kdtree',
          results: response.results,
          stats: response.stats,
        };
      }

      case 'geohash': {
        const response = geohashSearch(
          this.geohashIndex,
          lat,
          lng,
          skill,
          k
        );
        return {
          success: true,
          algorithm: 'geohash',
          results: response.results,
          stats: response.stats,
        };
      }

      default:
        throw new Error(`Unsupported algorithm: ${algo}`);
    }
  }

  /**
   * Compares all three algorithms on the exact same query
   */
  compare(lat, lng, skill, k = 3) {
    this.ensureInitialized();

    const naiveRes = naiveSearch(this.workers, lat, lng, skill, k);
    const kdRes = kdTreeSearch(this.kdTreeRoot, lat, lng, skill, k, this.workers.length);
    const geoRes = geohashSearch(this.geohashIndex, lat, lng, skill, k);

    // Verify consistency across all three
    const naiveIds = naiveRes.results.map((r) => r.id);
    const kdIds = kdRes.results.map((r) => r.id);
    const geoIds = geoRes.results.map((r) => r.id);

    const matchesKD = JSON.stringify(naiveIds) === JSON.stringify(kdIds);
    const matchesGeo = JSON.stringify(naiveIds) === JSON.stringify(geoIds);
    const allMatch = matchesKD && matchesGeo;

    return {
      success: true,
      query: { lat, lng, skill, k },
      allMatch,
      algorithms: {
        naive: {
          algorithm: 'naive',
          displayName: 'Basic Search',
          technicalName: 'Naive Linear Search',
          results: naiveRes.results,
          stats: naiveRes.stats,
        },
        kdtree: {
          algorithm: 'kdtree',
          displayName: 'Smart Location Search',
          technicalName: 'KD-Tree',
          results: kdRes.results,
          stats: kdRes.stats,
        },
        geohash: {
          algorithm: 'geohash',
          displayName: 'Area-Based Search',
          technicalName: 'Geohash Grid',
          results: geoRes.results,
          stats: geoRes.stats,
        },
      },
    };
  }
}

const spatialIndexManager = new SpatialIndexManager();

module.exports = spatialIndexManager;

