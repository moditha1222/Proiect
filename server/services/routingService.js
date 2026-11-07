/**
 * Routing Service for ALLIN
 * Handles coordinate snapping to the synthetic city graph and executes
 * Dijkstra or A* shortest path algorithms.
 */

const { getCityGraph } = require('../graph/cityGraph');
const { dijkstra } = require('../algorithms/dijkstra');
const { astar } = require('../algorithms/astar');

class RoutingService {
  constructor() {
    this.graph = getCityGraph();
  }

  calculateRoute(fromLat, fromLng, toLat, toLng, algo = 'astar') {
    const startNode = this.graph.snapToNearestNode(fromLat, fromLng);
    const targetNode = this.graph.snapToNearestNode(toLat, toLng);

    if (!startNode || !targetNode) {
      throw new Error('Could not snap coordinates to graph nodes');
    }

    const normalizedAlgo = (algo || 'astar').toLowerCase();
    let result;

    if (normalizedAlgo === 'dijkstra') {
      result = dijkstra(this.graph, startNode.id, targetNode.id);
    } else if (normalizedAlgo === 'astar') {
      result = astar(this.graph, startNode.id, targetNode.id);
    } else {
      throw new Error(`Unsupported routing algorithm: ${algo}`);
    }

    return {
      ...result,
      snappedStart: { id: startNode.id, lat: startNode.lat, lng: startNode.lng },
      snappedTarget: { id: targetNode.id, lat: targetNode.lat, lng: targetNode.lng },
    };
  }

  compareRoutes(fromLat, fromLng, toLat, toLng) {
    const startNode = this.graph.snapToNearestNode(fromLat, fromLng);
    const targetNode = this.graph.snapToNearestNode(toLat, toLng);

    if (!startNode || !targetNode) {
      throw new Error('Could not snap coordinates to graph nodes');
    }

    const dijkstraResult = dijkstra(this.graph, startNode.id, targetNode.id);
    const astarResult = astar(this.graph, startNode.id, targetNode.id);

    const costDiff = Math.abs(dijkstraResult.etaMinutes - astarResult.etaMinutes);
    const equalCost = costDiff < 0.01;

    return {
      success: true,
      equalCost,
      snappedStart: { id: startNode.id, lat: startNode.lat, lng: startNode.lng },
      snappedTarget: { id: targetNode.id, lat: targetNode.lat, lng: targetNode.lng },
      dijkstra: {
        ...dijkstraResult,
        displayName: 'Complete Route Search',
        technicalName: 'Dijkstra',
      },
      astar: {
        ...astarResult,
        displayName: 'Smart Route Search',
        technicalName: 'A*',
      },
    };
  }
}

const routingService = new RoutingService();

module.exports = routingService;

