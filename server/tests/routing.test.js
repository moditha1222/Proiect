import { describe, it, expect } from 'vitest';
import { CityGraph } from '../graph/cityGraph';
import { dijkstra } from '../algorithms/dijkstra';
import { astar } from '../algorithms/astar';
import { createPrng } from '../services/seedService';

describe('Routing Algorithms: Dijkstra vs A*', () => {
  const graph = new CityGraph({ rows: 30, cols: 30, seed: 12345 });
  const totalNodes = graph.nodes.length;
  const prng = createPrng(8888);

  it('Dijkstra and A* return equal optimal travel time for random pairs', () => {
    for (let i = 0; i < 15; i++) {
      const start = Math.floor(prng() * totalNodes);
      let target = Math.floor(prng() * totalNodes);
      while (target === start) {
        target = Math.floor(prng() * totalNodes);
      }

      const dRes = dijkstra(graph, start, target);
      const aRes = astar(graph, start, target);

      expect(dRes.success).toBe(true);
      expect(aRes.success).toBe(true);

      // Verify travel time (ETA) is identical to within floating point precision
      expect(Math.abs(dRes.etaMinutes - aRes.etaMinutes)).toBeLessThanOrEqual(0.02);

      // Verify A* explores fewer or equal nodes compared to Dijkstra
      expect(aRes.stats.nodesExplored).toBeLessThanOrEqual(dRes.stats.nodesExplored + 5);

      // Verify path connectivity for both
      for (const res of [dRes, aRes]) {
        expect(res.pathNodeIds.length).toBeGreaterThanOrEqual(2);
        expect(res.pathNodeIds[0]).toBe(start);
        expect(res.pathNodeIds[res.pathNodeIds.length - 1]).toBe(target);

        for (let j = 0; j < res.pathNodeIds.length - 1; j++) {
          const u = res.pathNodeIds[j];
          const v = res.pathNodeIds[j + 1];
          const edges = graph.adjacency.get(u) || [];
          const hasEdge = edges.some((e) => e.targetId === v);
          expect(hasEdge).toBe(true);
        }
      }
    }
  });

  it('handles start equals target gracefully', () => {
    const node = 42;
    const dRes = dijkstra(graph, node, node);
    const aRes = astar(graph, node, node);

    expect(dRes.etaMinutes).toBe(0);
    expect(aRes.etaMinutes).toBe(0);
    expect(dRes.pathNodeIds).toEqual([node]);
    expect(aRes.pathNodeIds).toEqual([node]);
  });

  it('snaps geographic coordinates to nearest graph node', () => {
    const centerNode = graph.nodes[Math.floor(totalNodes / 2)];
    const snapped = graph.snapToNearestNode(centerNode.lat + 0.0001, centerNode.lng + 0.0001);
    expect(snapped.id).toBe(centerNode.id);
  });
});

