/**
 * A* Shortest Path Algorithm (Smart Route Search)
 * Fully custom implementation using custom binary Min-Heap and admissible Haversine heuristic.
 * Guarantees optimal path identical in cost to Dijkstra while exploring fewer nodes.
 */

const { haversineDistance } = require('../utils/geo');
const { MAX_SPEED_KM_PER_MIN } = require('../graph/cityGraph');
const { BinaryHeap } = require('./minHeap');

function astar(graph, startNodeId, targetNodeId) {
  const startTime = performance.now();
  const totalNodes = graph.nodes.length;
  const targetNode = graph.nodes[targetNodeId];

  // Admissible & consistent heuristic: Haversine distance divided by max speed bound
  function heuristic(node) {
    const distKm = haversineDistance(node.lat, node.lng, targetNode.lat, targetNode.lng);
    return distKm / MAX_SPEED_KM_PER_MIN; // in minutes
  }

  const gScore = new Float64Array(totalNodes);
  gScore.fill(Infinity);
  const fScore = new Float64Array(totalNodes);
  fScore.fill(Infinity);
  const prev = new Int32Array(totalNodes);
  prev.fill(-1);
  const closedSet = new Uint8Array(totalNodes);

  gScore[startNodeId] = 0;
  const initialH = heuristic(graph.nodes[startNodeId]);
  fScore[startNodeId] = initialH;

  // Min-Heap ordered by fScore, tie breaking on hScore (closer to target), then id
  const pq = new BinaryHeap((a, b) => {
    const diffF = a.f - b.f;
    if (Math.abs(diffF) > 1e-9) return diffF < 0 ? -1 : 1;
    const diffH = a.h - b.h;
    if (Math.abs(diffH) > 1e-9) return diffH < 0 ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  pq.push({ id: startNodeId, f: initialH, h: initialH });

  const exploredNodes = [];
  let found = false;

  while (!pq.isEmpty()) {
    const current = pq.pop();
    const u = current.id;

    if (closedSet[u]) continue;
    closedSet[u] = 1;

    const nodeU = graph.nodes[u];
    exploredNodes.push({
      id: u,
      lat: Number(nodeU.lat.toFixed(6)),
      lng: Number(nodeU.lng.toFixed(6)),
    });

    if (u === targetNodeId) {
      found = true;
      break;
    }

    const edges = graph.adjacency.get(u) || [];
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const v = edge.targetId;
      if (closedSet[v]) continue;

      const tentativeG = gScore[u] + edge.weight;
      if (tentativeG < gScore[v]) {
        gScore[v] = tentativeG;
        prev[v] = u;
        const h = heuristic(graph.nodes[v]);
        const f = tentativeG + h;
        fScore[v] = f;
        pq.push({ id: v, f, h });
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (!found && startNodeId !== targetNodeId) {
    return {
      success: false,
      algorithm: 'astar',
      path: [],
      pathNodeIds: [],
      etaMinutes: 0,
      stats: {
        executionTimeMs,
        nodesExplored: exploredNodes.length,
      },
      exploredNodes,
    };
  }

  // Reconstruct path
  const pathNodeIds = [];
  let curr = targetNodeId;
  while (curr !== -1) {
    pathNodeIds.push(curr);
    if (curr === startNodeId) break;
    curr = prev[curr];
  }
  pathNodeIds.reverse();

  const path = pathNodeIds.map((id) => {
    const node = graph.nodes[id];
    return {
      lat: Number(node.lat.toFixed(6)),
      lng: Number(node.lng.toFixed(6)),
    };
  });

  const etaMinutes = Number(gScore[targetNodeId].toFixed(2));

  return {
    success: true,
    algorithm: 'astar',
    path,
    pathNodeIds,
    etaMinutes,
    stats: {
      executionTimeMs,
      nodesExplored: exploredNodes.length,
    },
    exploredNodes,
  };
}

module.exports = {
  astar,
};

