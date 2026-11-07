# ALLIN Client – React Frontend

Frontend single-page application for **ALLIN – Nearest Worker Search & ETA Engine**.

## Features
- **Map & Worker Search (`/` or `/map`):** Leaflet interactive map with custom customer pins, numbered nearest worker badges, real-time route polyline, and search stats.
- **Algorithm Comparison (`/compare`):** Side-by-side comparison cards for Basic Search, Smart Tree Search (KD-Tree), and Area-Based Search (Geohash Grid).
- **Route Planning (`/route`):** Dijkstra vs. A* shortest-path visualization with explored node overlay.
- **Performance Benchmark (`/benchmark`):** Interactive Recharts graphs with linear and logarithmic scaling.

## Environment Configuration
Create a `.env` file from `.env.example`:
```env
# Optional: Set backend API URL if frontend is deployed separately (e.g. on Vercel/Netlify)
# If blank, defaults to relative '/api'
VITE_API_URL=
```

## Available Scripts
- `npm run dev`: Launch Vite development server with `/api` proxy to port 5000.
- `npm run build`: Compile optimized production bundle to `dist/`.
- `npm run preview`: Preview production build locally.
