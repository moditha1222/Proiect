import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  Clock,
  Compass,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateRoute, compareRoutes } from '../services/api';

// Custom icons
const createStartIcon = () =>
  L.divIcon({
    className: 'custom-customer-marker',
    html: '<div style="width:20px;height:20px;background:#16A34A;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const createDestIcon = () =>
  L.divIcon({
    className: 'custom-customer-marker',
    html: '<div style="width:22px;height:22px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">W</div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function MapBoundsController({ path, exploredNodes, showExplored }) {
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      const bounds = L.latLngBounds(path.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [path, map]);
  return null;
}

export default function RoutePage() {
  const {
    customerLocation,
    selectedWorker,
    setSelectedWorker,
    allWorkers,
    showToast,
  } = useApp();

  const [routeAlgo, setRouteAlgo] = useState('astar'); // 'astar' | 'dijkstra'
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [showExplored, setShowExplored] = useState(true);
  const [routeResult, setRouteResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fallback target worker if none selected
  const activeWorker =
    selectedWorker ||
    (allWorkers.length > 0 ? allWorkers.find((w) => w.available === 1) : null) || {
      id: 999,
      name: 'Rohit Sharma',
      skill: 'plumber',
      lat: 16.315,
      lng: 80.448,
      rating: 4.8,
    };

  const executeRouteCalculation = async () => {
    if (!activeWorker) return;
    setIsLoading(true);

    try {
      if (isCompareMode) {
        const comp = await compareRoutes(
          customerLocation.lat,
          customerLocation.lng,
          activeWorker.lat,
          activeWorker.lng
        );
        setComparisonResult(comp);
        setRouteResult(comp[routeAlgo]);
      } else {
        const res = await calculateRoute(
          customerLocation.lat,
          customerLocation.lng,
          activeWorker.lat,
          activeWorker.lng,
          routeAlgo
        );
        setRouteResult(res);
      }
    } catch (err) {
      showToast(`Routing failed: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeRouteCalculation();
  }, [routeAlgo, isCompareMode, activeWorker?.id]);

  const displayedPath = isCompareMode
    ? comparisonResult?.[routeAlgo]?.path || []
    : routeResult?.path || [];

  const displayedExplored = isCompareMode
    ? comparisonResult?.[routeAlgo]?.exploredNodes || []
    : routeResult?.exploredNodes || [];

  const displayedEta = isCompareMode
    ? comparisonResult?.[routeAlgo]?.etaMinutes
    : routeResult?.etaMinutes;

  const displayedStats = isCompareMode
    ? comparisonResult?.[routeAlgo]?.stats
    : routeResult?.stats;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Plan Your Route</h1>
        <p className="page-subtitle">
          Discover the optimal path on the synthetic city road network to reach your selected worker.
        </p>
      </div>

      {/* Route Controls Bar */}
      <div className="search-controls-bar">
        <div className="controls-group">
          {/* From Location */}
          <div className="control-item">
            <label>From (You)</label>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
              {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
            </span>
          </div>

          {/* Destination Worker */}
          <div className="control-item">
            <label>To (Worker)</label>
            <select
              value={activeWorker?.id || ''}
              onChange={(e) => {
                const found = allWorkers.find((w) => w.id === Number(e.target.value));
                if (found) setSelectedWorker(found);
              }}
            >
              {allWorkers
                .filter((w) => w.available === 1)
                .slice(0, 15)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.skill})
                  </option>
                ))}
            </select>
          </div>

          {/* Algorithm Toggle / Mode */}
          <div className="control-item" style={{ gap: 6 }}>
            <label>Algorithm</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${routeAlgo === 'dijkstra' ? 'active' : ''}`}
                onClick={() => setRouteAlgo('dijkstra')}
              >
                Dijkstra
              </button>
              <button
                className={`toggle-btn ${routeAlgo === 'astar' ? 'active' : ''}`}
                onClick={() => setRouteAlgo('astar')}
              >
                A* Search
              </button>
            </div>
          </div>

          {/* Compare Both Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-navy)' }}>
            <input
              type="checkbox"
              checked={isCompareMode}
              onChange={(e) => setIsCompareMode(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Side-by-Side Comparison</span>
          </label>

          {/* Show Explored Nodes Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-navy)' }}>
            <input
              type="checkbox"
              checked={showExplored}
              onChange={(e) => setShowExplored(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Show Explored Locations</span>
          </label>
        </div>

        <button
          className="btn btn-primary"
          onClick={executeRouteCalculation}
          disabled={isLoading}
        >
          <Navigation size={16} />
          <span>{isLoading ? 'Routing...' : 'Find Route'}</span>
        </button>
      </div>

      {/* Main Map & Route Stats Layout */}
      <div className="map-page-layout">
        {/* Left Map View */}
        <div className="map-wrapper">
          <MapContainer
            center={[customerLocation.lat, customerLocation.lng]}
            zoom={13}
            scrollWheelZoom={true}
            className="map-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBoundsController
              path={displayedPath}
              exploredNodes={displayedExplored}
              showExplored={showExplored}
            />

            {/* Start Customer Marker */}
            <Marker
              position={[customerLocation.lat, customerLocation.lng]}
              icon={createStartIcon()}
            >
              <Popup>
                <strong>Start Point (Customer)</strong>
              </Popup>
            </Marker>

            {/* Destination Worker Marker */}
            {activeWorker && (
              <Marker
                position={[activeWorker.lat, activeWorker.lng]}
                icon={createDestIcon()}
              >
                <Popup>
                  <strong>Destination ({activeWorker.name})</strong>
                  <br />
                  Skill: {activeWorker.skill}
                </Popup>
              </Marker>
            )}

            {/* Explored Graph Nodes (rendered efficiently via lightweight CircleMarkers) */}
            {showExplored &&
              displayedExplored.map((node) => (
                <CircleMarker
                  key={`exp-${node.id}`}
                  center={[node.lat, node.lng]}
                  radius={2.5}
                  pathOptions={{
                    fillColor: '#06B6D4',
                    fillOpacity: 0.45,
                    color: '#0891B2',
                    weight: 1,
                  }}
                />
              ))}

            {/* Shortest Route Polyline */}
            {displayedPath.length > 0 && (
              <Polyline
                positions={displayedPath.map((p) => [p.lat, p.lng])}
                color="#2563EB"
                weight={6}
                opacity={0.9}
              />
            )}
          </MapContainer>

          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#16A34A' }} />
              <span>Start (You)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#2563EB' }} />
              <span>Worker Destination</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#06B6D4' }} />
              <span>Explored Locations ({displayedExplored.length})</span>
            </div>
          </div>
        </div>

        {/* Right Route Stats Panel */}
        <div className="map-sidebar-panel">
          {/* Main Route Stats Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={18} color="var(--primary-blue)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                  {routeAlgo === 'astar' ? 'Smart Route Search (A*)' : 'Complete Route Search (Dijkstra)'}
                </h3>
              </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-pill">
                <div className="stat-pill-label">Estimated Arrival</div>
                <div className="stat-pill-val" style={{ color: 'var(--primary-blue)' }}>
                  {displayedEta !== undefined ? `${displayedEta} min` : '--'}
                </div>
              </div>

              <div className="stat-pill">
                <div className="stat-pill-label">Locations Checked</div>
                <div className="stat-pill-val">{displayedStats?.nodesExplored || '--'}</div>
              </div>

              <div className="stat-pill">
                <div className="stat-pill-label">Search Time</div>
                <div className="stat-pill-val">
                  {displayedStats?.executionTimeMs !== undefined
                    ? `${displayedStats.executionTimeMs} ms`
                    : '--'}
                </div>
              </div>

              <div className="stat-pill">
                <div className="stat-pill-label">Path Nodes</div>
                <div className="stat-pill-val">{displayedPath.length || '--'}</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                backgroundColor: 'var(--success-light)',
                border: '1px solid #BBF7D0',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.8rem',
                color: '#166534',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} color="var(--success-green)" />
              <span>Both algorithms guarantee the mathematically optimal shortest travel time!</span>
            </div>
          </div>

          {/* Side-by-Side Comparison Box if comparison mode active */}
          {isCompareMode && comparisonResult && (
            <div className="card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: 12 }}>
                Algorithm Comparison
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Dijkstra Column */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-navy)' }}>
                    Dijkstra Search
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Complete Exploration</div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>ETA</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{comparisonResult.dijkstra.etaMinutes} min</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Nodes Checked</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{comparisonResult.dijkstra.stats.nodesExplored}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Search Time</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{comparisonResult.dijkstra.stats.executionTimeMs} ms</div>
                  </div>
                </div>

                {/* A* Column */}
                <div style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, border: '1px solid var(--light-blue-border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-blue)' }}>
                    A* Search
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary-blue)' }}>Heuristic Guided</div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>ETA</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-blue)' }}>
                      {comparisonResult.astar.etaMinutes} min
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Nodes Checked</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success-green)' }}>
                      {comparisonResult.astar.stats.nodesExplored}
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Search Time</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-blue)' }}>
                      {comparisonResult.astar.stats.executionTimeMs} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Exploration reduction metric */}
              <div
                style={{
                  marginTop: 12,
                  padding: '8px 10px',
                  backgroundColor: '#DCFCE7',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.78rem',
                  color: '#15803D',
                  fontWeight: 600,
                }}
              >
                <TrendingDown size={16} />
                <span>
                  A* explored{' '}
                  {(
                    ((comparisonResult.dijkstra.stats.nodesExplored -
                      comparisonResult.astar.stats.nodesExplored) /
                      comparisonResult.dijkstra.stats.nodesExplored) *
                    100
                  ).toFixed(1)}
                  % fewer locations while finding the exact same shortest travel time!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

