import { describe, it, expect } from 'vitest';
import { generateDeterministicWorkers, createPrng, SKILLS } from '../services/seedService';
import { naiveSearch } from '../algorithms/naiveSearch';
import { buildKDTree, prepareWorkersForKDTree, kdTreeSearch } from '../algorithms/kdTree';
import { buildGeohashIndex, geohashSearch } from '../algorithms/geohash';

describe('Nearest Worker Search Algorithms Consistency', () => {
  const centerLat = 16.3067;
  const centerLng = 80.4365;

  it('all three algorithms return identical top-K results across random queries', () => {
    // Generate deterministic dataset with mixed skills and availability
    const workers = generateDeterministicWorkers(200, 424242, centerLat, centerLng);
    const kdPrepared = prepareWorkersForKDTree(workers);
    const kdRoot = buildKDTree(kdPrepared);
    const geoIndex = buildGeohashIndex(workers, 6);

    const queryPrng = createPrng(1337);

    // Run 25 random queries with various locations, skills, and K values
    for (let i = 0; i < 25; i++) {
      const qLat = centerLat + (queryPrng() - 0.5) * 0.1;
      const qLng = centerLng + (queryPrng() - 0.5) * 0.1;
      const skill = SKILLS[Math.floor(queryPrng() * SKILLS.length)];
      const k = Math.floor(queryPrng() * 5) + 1; // k between 1 and 5

      const naiveRes = naiveSearch(workers, qLat, qLng, skill, k);
      const kdRes = kdTreeSearch(kdRoot, qLat, qLng, skill, k, workers.length);
      const geoRes = geohashSearch(geoIndex, qLat, qLng, skill, k);

      // Verify returned worker counts match
      expect(kdRes.results.length).toBe(naiveRes.results.length);
      expect(geoRes.results.length).toBe(naiveRes.results.length);

      // Verify exact matching order of worker IDs
      const naiveIds = naiveRes.results.map((r) => r.id);
      const kdIds = kdRes.results.map((r) => r.id);
      const geoIds = geoRes.results.map((r) => r.id);

      expect(kdIds).toEqual(naiveIds);
      expect(geoIds).toEqual(naiveIds);

      // Verify calculated distances match
      for (let j = 0; j < naiveRes.results.length; j++) {
        expect(kdRes.results[j].distanceKm).toBeCloseTo(naiveRes.results[j].distanceKm, 2);
        expect(geoRes.results[j].distanceKm).toBeCloseTo(naiveRes.results[j].distanceKm, 2);
      }
    }
  });

  it('handles edge case: empty dataset', () => {
    const emptyWorkers = [];
    const kdPrepared = prepareWorkersForKDTree(emptyWorkers);
    const kdRoot = buildKDTree(kdPrepared);
    const geoIndex = buildGeohashIndex(emptyWorkers, 6);

    const naiveRes = naiveSearch(emptyWorkers, centerLat, centerLng, 'plumber', 3);
    const kdRes = kdTreeSearch(kdRoot, centerLat, centerLng, 'plumber', 3, 0);
    const geoRes = geohashSearch(geoIndex, centerLat, centerLng, 'plumber', 3);

    expect(naiveRes.results).toEqual([]);
    expect(kdRes.results).toEqual([]);
    expect(geoRes.results).toEqual([]);
  });

  it('handles edge case: K larger than available matching workers', () => {
    const workers = generateDeterministicWorkers(30, 999, centerLat, centerLng);
    const kdPrepared = prepareWorkersForKDTree(workers);
    const kdRoot = buildKDTree(kdPrepared);
    const geoIndex = buildGeohashIndex(workers, 6);

    const naiveRes = naiveSearch(workers, centerLat, centerLng, 'painter', 50);
    const kdRes = kdTreeSearch(kdRoot, centerLat, centerLng, 'painter', 50, workers.length);
    const geoRes = geohashSearch(geoIndex, centerLat, centerLng, 'painter', 50);

    const naiveIds = naiveRes.results.map((r) => r.id);
    const kdIds = kdRes.results.map((r) => r.id);
    const geoIds = geoRes.results.map((r) => r.id);

    expect(kdIds).toEqual(naiveIds);
    expect(geoIds).toEqual(naiveIds);
  });

  it('correctly filters out unavailable workers', () => {
    const workers = [
      { id: 1, name: 'A', skill: 'plumber', lat: 16.30, lng: 80.43, rating: 4.5, available: 0 },
      { id: 2, name: 'B', skill: 'plumber', lat: 16.31, lng: 80.44, rating: 4.0, available: 1 },
    ];
    const kdPrepared = prepareWorkersForKDTree(workers);
    const kdRoot = buildKDTree(kdPrepared);
    const geoIndex = buildGeohashIndex(workers, 6);

    const naiveRes = naiveSearch(workers, 16.30, 80.43, 'plumber', 3);
    const kdRes = kdTreeSearch(kdRoot, 16.30, 80.43, 'plumber', 3, workers.length);
    const geoRes = geohashSearch(geoIndex, 16.30, 80.43, 'plumber', 3);

    expect(naiveRes.results.map((r) => r.id)).toEqual([2]);
    expect(kdRes.results.map((r) => r.id)).toEqual([2]);
    expect(geoRes.results.map((r) => r.id)).toEqual([2]);
  });
});

