/**
 * Dijkstra's Shortest Path Algorithm (Complete Route Search)
 * Fully custom implementation using custom binary Min-Heap.
 * Finds the optimal minimum travel-time path between start and target graph nodes.
 */

const { MinHeap } = require('./minHeap');

function dijkstra(graph, startNodeId, targetNodeId) {
  const startTime = performance.now();
  const totalNodes = graph.nodes.length;

  const dist = new Float64Array(totalNodes);
  dist.fill(Infinity);
  const prev = new Int32Array(totalNodes);
  prev.fill(-1);
  const visited = new Uint8Array(totalNodes);

  dist[startNodeId] = 0;

  // Min-Heap ordered by distance, tie-breaking on node id
  const pq = new MinHeap((item) => item.dist);
  pq.push({ id: startNodeId, dist: 0 });

  const exploredNodes = [];
  let found = false;

  while (!pq.isEmpty()) {
    const current = pq.pop();
    const u = current.id;

    if (visited[u]) continue;
    visited[u] = 1;

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
      if (visited[v]) continue;

      const newDist = dist[u] + edge.weight;
      if (newDist < dist[v]) {
        dist[v] = newDist;
        prev[v] = u;
        pq.push({ id: v, dist: newDist });
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(3));

  if (!found && startNodeId !== targetNodeId) {
    return {
      success: false,
      algorithm: 'dijkstra',
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

  const etaMinutes = Number(dist[targetNodeId].toFixed(2));

  return {
    success: true,
    algorithm: 'dijkstra',
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
  dijkstra,
};

