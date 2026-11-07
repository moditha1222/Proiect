# ALLIN – Nearest Worker Search & ETA Engine

> **"Smarter Search. Faster Service."**  
> A high-performance, academic CSE production-quality full-stack platform comparing spatial indexing and shortest-path graph algorithms.

---

## 1. Project Introduction & Overview

**ALLIN** is a commercial-grade home-services marketplace and algorithmic research engine designed to solve two core logistics challenges:
1. **Finding the nearest available service professionals** (plumbers, electricians, cleaners, carpenters, painters) to a customer's real-time geographic location.
2. **Calculating the fastest route and estimated time of arrival (ETA)** across an urban road network.

This application demonstrates the practical implementation, mathematical correctness, and empirical performance comparison of:
- **Spatial Nearest-Neighbor Search:**
  - Naive Linear Search ($O(N \log N)$)
  - 3D Unit-Sphere KD-Tree ($O(\log N)$ average query)
  - Geohash Spatial Grid with Branch-and-Bound Stopping Condition
- **Shortest-Path Graph Routing:**
  - Dijkstra’s Algorithm (Complete exploration)
  - A* Search Algorithm (Admissible Haversine heuristic)
- **Data Structures Built from Scratch:**
  - Binary Min-Heap & Max-Heap
  - 3D Unit-Sphere KD-Tree with bounding box branch pruning
  - Geohash Base32 encoder/decoder and spatial grid
  - Adjacency list road network graph (2,500 nodes, 50×50 grid)
- **Empirical Benchmarking & Analytics:**
  - High-resolution timing (`performance.now()`) across dataset sizes (100 to 50,000 workers)
  - Exploratory and candidate-examination efficiency tracking
  - Interactive Recharts visualization with linear and logarithmic scaling

---

## 2. Important UI/UX Terminology Mapping

To maintain commercial SaaS polish for customer-facing views while preserving academic rigour, the interface translates technical terms as follows:

| Technical Name | Frontend Display Name | Concept Description |
|---|---|---|
| **Naive Linear Search** | **Basic Search** | Scans matching workers sequentially |
| **KD-Tree** | **Smart Location Search** | 3D unit-sphere hierarchical spatial tree |
| **Geohash Grid** | **Area-Based Search** | Base32 hierarchical bounding box cells |
| **Dijkstra Algorithm** | **Complete Route Search** | Uniform-cost exploration across graph nodes |
| **A\* Algorithm** | **Smart Route Search** | Heuristic-guided goal-directed search |
| **Candidates Examined** | **Workers Checked** | Worker distance computations evaluated |
| **Nodes Explored** | **Map Locations Checked** | Graph vertices settled from priority queue |
| **Execution Time** | **Search Time** | High-precision query duration (ms) |
| **ETA** | **Estimated Arrival** | Shortest path travel time in minutes |

*Note: Internal API parameters and algorithmic routines retain their standard technical names (`naive`, `kdtree`, `geohash`, `dijkstra`, `astar`).*

---

## 3. Technology Stack

- **Frontend:**
  - React 19 + Vite
  - React Router DOM v7
  - Leaflet & React Leaflet (OpenStreetMap raster tiles)
  - Recharts (Interactive Line & Bar Analytics)
  - Lucide React (SaaS iconography)
  - Modern CSS Design System (Custom variables, responsive flex/grid)
- **Backend:**
  - Node.js (v20+)
  - Express.js v5
  - SQLite via `better-sqlite3` (WAL mode enabled)
  - CORS, Dotenv
- **Testing & Verification:**
  - Vitest (Automated test runner)
  - Supertest (REST API endpoint testing)
  - Playwright (Headless Chromium browser automation & screenshots)

---

## 4. System Architecture & Folder Structure

```
ALLIN/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   │   └── AppContext.jsx          # Central state & toast notifications
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx           # Sidebar, top header & reseed modal
│   │   ├── pages/
│   │   │   ├── FindWorkersPage.jsx     # Page 1: Map & nearest worker search
│   │   │   ├── ComparePage.jsx         # Page 2: Three-algorithm comparison
│   │   │   ├── RoutePage.jsx           # Page 3: Dijkstra vs A* route planning
│   │   │   └── BenchmarkPage.jsx       # Page 4: Scaling analytics & charts
│   │   ├── services/
│   │   │   └── api.js                  # Centralized REST client
│   │   ├── styles/
│   │   │   └── index.css               # Design system & responsive styles
│   │   ├── App.jsx                     # Route definitions
│   │   └── main.jsx                    # React root entry
│   ├── index.html                      # HTML root with Inter & Leaflet CSS
│   ├── vite.config.js                  # Vite configuration & /api proxy
│   └── package.json
│
├── server/
│   ├── algorithms/
│   │   ├── naiveSearch.js              # Haversine linear scan
│   │   ├── kdTree.js                   # 3D unit-sphere KD-tree
│   │   ├── geohash.js                  # Custom Base32 geohash grid
│   │   ├── dijkstra.js                 # Dijkstra using custom min-heap
│   │   ├── astar.js                    # A* with admissible heuristic
│   │   └── minHeap.js                  # Custom Binary Min-Heap & Max-Heap
│   ├── graph/
│   │   └── cityGraph.js                # 2,500-node connected city graph
│   ├── database/
│   │   ├── db.js                       # SQLite initialization
│   │   └── schema.sql                  # Schema & compound indexes
│   ├── routes/
│   │   ├── workers.js                  # GET /api/workers, GET /api/workers/nearest
│   │   ├── route.js                    # GET /api/route, GET /api/route/compare
│   │   ├── compare.js                  # GET /api/compare
│   │   ├── seed.js                     # POST /api/seed
│   │   └── benchmark.js                # GET /api/benchmark
│   ├── services/
│   │   ├── seedService.js              # Deterministic Mulberry32 worker generator
│   │   ├── spatialIndexManager.js      # Cached in-memory KD-Tree & Geohash index
│   │   ├── routingService.js           # Snapping & route comparison
│   │   └── benchmarkService.js         # Empirical scaling benchmarks
│   ├── utils/
│   │   ├── geo.js                      # Haversine, 3D unit-sphere, bounding boxes
│   │   └── validation.js               # Robust input validation (HTTP 400s)
│   ├── tests/
│   │   ├── nearestSearch.test.js       # Consistency tests across 3 algorithms
│   │   ├── routing.test.js             # Optimality tests (Dijkstra vs A*)
│   │   ├── api.test.js                 # REST endpoints & validation tests
│   │   └── reproducibility.test.js     # Deterministic PRNG verification
│   ├── app.js                          # Express app configuration & static SPA
│   └── index.js                        # Server entrypoint & port listener
│
├── screenshots/                        # Actual verified browser screenshots
├── scripts/
│   └── verifyAndCapture.js             # Automated browser verification script
├── .env.example
├── .gitignore
├── package.json                        # Root npm scripts (concurrently dev, test)
└── README.md
```

---

## 5. Database Design & Seeding

### Schema (`server/database/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  skill TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  rating REAL NOT NULL,
  available INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workers_skill_avail ON workers (skill, available);
CREATE INDEX IF NOT EXISTS idx_workers_coords ON workers (lat, lng);
```

### Deterministic Seeding (`POST /api/seed`)
- Employs a custom 32-bit **Mulberry32 Pseudo-Random Number Generator**.
- Identical `seed` and `n` guarantee byte-for-byte identical datasets.
- Realistic Indian names, ratings distributed between 3.0 and 5.0, skills (Plumber, Electrician, Cleaner, Carpenter, Painter), and availability flag (1 or 0).
- Geographic coordinates sampled via polar uniform disk distribution around the configured city center (`CITY_CENTER_LAT`, `CITY_CENTER_LNG`).
- Wrapped in a high-speed SQLite atomic transaction (`db.transaction()`).

---

## 6. Algorithmic Implementations (All Built from Scratch)

### A. Haversine Distance
Computes the great-circle distance between two points on Earth ($R = 6371\text{ km}$):
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \times \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

### B. 3D Unit-Sphere KD-Tree
- Standard 2D latitude/longitude Euclidean KD-trees cannot provide exact Haversine pruning because meridians converge at the poles.
- ALLIN projects every point $(\phi, \lambda)$ onto 3D Cartesian coordinates on the unit sphere:
  $$x = \cos(\phi)\cos(\lambda), \quad y = \cos(\phi)\sin(\lambda), \quad z = \sin(\phi)$$
- Unit-sphere Euclidean chord distance $c$ is strictly monotonically related to great-circle distance $d$:
  $$c = 2\sin\left(\frac{d}{2R}\right) \iff d = 2R\arcsin\left(\frac{c}{2}\right)$$
- Every KD-Tree node maintains a 3D bounding box $[x_{\min}, x_{\max}] \times [y_{\min}, y_{\max}] \times [z_{\min}, z_{\max}]$ and skill bitmask.
- Subtrees are pruned if the minimum distance from query point $Q$ to the bounding box exceeds the current $K$-th best chord distance in the Max-Heap.

### C. Geohash Spatial Grid with Branch-and-Bound
- Custom Base32 bit-interleaving geohash implementation.
- Workers are indexed into geohash cells at precision 6 (~1.2 km × 0.6 km).
- Concentric and neighboring cells are visited using a Min-Heap prioritized by `minDistToBoundingBox(query, cell.bbox)`.
- **Exact Stopping Condition:** Search safely terminates as soon as the nearest possible point in any unvisited cell exceeds the distance to the current $K$-th nearest worker. This guarantees 100% mathematical precision with zero false negatives.

### D. Synthetic City Graph
- 2,500 nodes arranged in a 50 × 50 grid (~10 km × 10 km).
- Connected spanning tree created first using deterministic Prim/BFS to guarantee 100% network connectivity.
- Additional horizontal, vertical, and diagonal road edges added with deterministic probability.
- Road speeds assigned between 30 km/h and 60 km/h ($V_{\max} = 60\text{ km/h} = 1.0\text{ km/min}$).
- Edge travel times: $w(u, v) = \frac{\text{dist}(u, v)}{v_{uv}} \ge \frac{\text{dist}(u, v)}{V_{\max}}$.

### E. Dijkstra vs A* Shortest-Path Search
- **Dijkstra:** Uniform-cost graph search utilizing a custom binary Min-Heap.
- **A\*:** Directed search using $f(n) = g(n) + h(n)$.
  $$h(n) = \frac{\text{haversineDistance}(n, \text{target})}{V_{\max}} \text{ (in minutes)}$$
- Because no road segment exceeds $V_{\max}$, $h(n)$ is **provably admissible** and **consistent** (monotonic).
- **Correctness Guarantee:** Dijkstra and A* return the **exact same optimal travel time** (ETA), while A* explores 50–70% fewer nodes.

---

## 7. Algorithmic Complexity Comparison

| Algorithm | Average Time Complexity | Worst-Case Time | Space Complexity | Guarantees Exact Top-K / Shortest Path? |
|---|---|---|---|---|
| **Naive Linear Scan** | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Yes (100% exact) |
| **3D Unit-Sphere KD-Tree** | $O(\log N)$ | $O(N)$ | $O(N)$ | Yes (Chord monotonic proof) |
| **Geohash Spatial Grid** | $O(1 + \frac{K}{\text{density}})$ | $O(N)$ | $O(N)$ | Yes (Bounding box lower bound) |
| **Dijkstra's Algorithm** | $O((V + E) \log V)$ | $O(E \log V)$ | $O(V)$ | Yes (Optimal shortest path) |
| **A\* Search** | $O((V + E) \log V)$ | $O(E \log V)$ | $O(V)$ | Yes (Admissible $h(n)$) |

---

## 8. API Endpoint Documentation

### 1. `GET /api/workers/nearest`
Finds the $K$ nearest available workers matching a service.
- **Parameters:**
  - `lat` (float, required): Customer latitude (-90 to 90)
  - `lng` (float, required): Customer longitude (-180 to 180)
  - `skill` (string, optional): `plumber`, `electrician`, `cleaner`, `carpenter`, `painter`
  - `k` (int, default 3): Number of results
  - `algo` (string, default `kdtree`): `naive`, `kdtree`, `geohash`
- **Response:**
```json
{
  "success": true,
  "algorithm": "kdtree",
  "results": [
    {
      "id": 14,
      "name": "Rohit Sharma",
      "skill": "plumber",
      "lat": 16.3082,
      "lng": 80.4351,
      "rating": 4.8,
      "available": true,
      "distanceKm": 0.224
    }
  ],
  "stats": {
    "executionTimeMs": 1.45,
    "candidatesExamined": 8,
    "totalWorkers": 50,
    "matchingWorkers": 11,
    "returnedWorkers": 1
  }
}
```

### 2. `GET /api/compare`
Executes all three spatial search algorithms on the exact same parameters and validates consistency.
- **Parameters:** `lat`, `lng`, `skill`, `k`
- **Response:**
```json
{
  "success": true,
  "allMatch": true,
  "algorithms": {
    "naive": { "algorithm": "naive", "results": [...], "stats": { ... } },
    "kdtree": { "algorithm": "kdtree", "results": [...], "stats": { ... } },
    "geohash": { "algorithm": "geohash", "results": [...], "stats": { ... } }
  }
}
```

### 3. `GET /api/route`
Calculates shortest path road route between two coordinates.
- **Parameters:**
  - `fromLat`, `fromLng`: Start coordinate
  - `toLat`, `toLng`: Destination coordinate
  - `algo`: `astar` or `dijkstra`
- **Response:**
```json
{
  "success": true,
  "algorithm": "astar",
  "path": [{ "lat": 16.3067, "lng": 80.4365 }, ...],
  "etaMinutes": 8.42,
  "stats": {
    "executionTimeMs": 1.15,
    "nodesExplored": 142
  },
  "exploredNodes": [{ "id": 105, "lat": 16.307, "lng": 80.437 }, ...]
}
```

### 4. `GET /api/route/compare`
Runs Dijkstra and A* side-by-side on identical endpoints.
- **Parameters:** `fromLat`, `fromLng`, `toLat`, `toLng`

### 5. `POST /api/seed`
Regenerates and persists worker dataset deterministically.
- **Body:** `{ "n": 50, "seed": 12345 }`

### 6. `GET /api/benchmark`
Runs empirical benchmarking across dataset sizes (e.g. 100, 1K, 10K, 50K).
- **Parameters:** `sizes=100,1000,10000,50000&queries=5`

---

## 9. Installation & Running Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup
1. Clone the repository and navigate to the project root:
   ```bash
   cd ALLIN
   ```
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```
3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

### Execution Commands
- **Run Full-Stack Development Mode (Server + Client concurrently):**
  ```bash
  npm run dev
  ```
  - Backend API: `http://localhost:5000`
  - Frontend UI: `http://localhost:5173`
- **Run Backend Only:**
  ```bash
  npm run server
  ```
- **Build Client for Production:**
  ```bash
  npm run build
  ```
- **Run Automated Vitest Suite:**
  ```bash
  npm test
  ```

---

## 10. Automated Testing & Verification

The suite includes 19 rigorous unit and integration tests covering:
1. `server/tests/nearestSearch.test.js`: Confirms identical top-K candidate IDs and distances across Naive, KD-Tree, and Geohash for 25 random queries.
2. `server/tests/routing.test.js`: Validates identical optimal travel times (ETAs) between Dijkstra and A*, graph connectivity, and coordinate snapping.
3. `server/tests/reproducibility.test.js`: Validates deterministic PRNG reproducibility across runs.
4. `server/tests/api.test.js`: Validates REST endpoints, error handling, and parameter boundary validations (HTTP 400s).

Run the tests at any time via:
```bash
npm test
```

---

## 11. Browser Screenshots

Verified screenshots captured via automated headless Chromium are located in the `screenshots/` directory:
1. `screenshots/1-map-page.png`: Interactive map, customer location pin, numbered worker badges, route preview, and search statistics.
2. `screenshots/2-comparison-page.png`: 3 comparison cards (Basic Search, Smart Tree Search, Grid Search), verification badge, and comparison table.
3. `screenshots/3-route-page.png`: Route polyline, explored nodes layer, ETA badge, and side-by-side Dijkstra vs A* metrics.
4. `screenshots/4-benchmark-page.png`: Search time vs number of workers line chart and route search nodes explored bar chart.
5. `screenshots/5-mobile-layout.png`: Mobile responsive layout at 390px viewport width.

