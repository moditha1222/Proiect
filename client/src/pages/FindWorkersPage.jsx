import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  CheckCircle,
  Clock,
  Users,
  Navigation,
  Star,
  Compass,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchNearestWorkers, calculateRoute } from '../services/api';

// Create custom leaflet icons
const createCustomerIcon = () =>
  L.divIcon({
    className: 'custom-customer-marker',
    html: '<div class="pulsing-customer-pin" title="Your Location"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const createWorkerBadgeIcon = (number, isSelected) =>
  L.divIcon({
    className: 'custom-worker-marker',
    html: `<div class="worker-badge-pin" style="${
      isSelected ? 'transform: scale(1.25); background: linear-gradient(135deg, #1D4ED8, #1E40AF); box-shadow: 0 0 14px rgba(37,99,235,0.8);' : ''
    }">${number}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const createOtherWorkerIcon = () =>
  L.divIcon({
    className: 'custom-worker-marker',
    html: '<div class="worker-dot-pin"></div>',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

// Map click handler component
function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller to smoothly pan map when customer location changes
function MapViewController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.panTo([center.lat, center.lng]);
    }
  }, [center, map]);
  return null;
}

export default function FindWorkersPage() {
  const navigate = useNavigate();
  const {
    config,
    customerLocation,
    setCustomerLocation,
    selectedSkill,
    setSelectedSkill,
    topK,
    setTopK,
    searchAlgo,
    setSearchAlgo,
    selectedWorker,
    setSelectedWorker,
    allWorkers,
    showToast,
  } = useApp();

  const [searchResults, setSearchResults] = useState([]);
  const [searchStats, setSearchStats] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Friendly name translations as required by Section 3
  const searchMethods = [
    { value: 'kdtree', label: 'Smart Location Search', tech: 'KD-Tree' },
    { value: 'naive', label: 'Basic Search', tech: 'Naive Linear Search' },
    { value: 'geohash', label: 'Area-Based Search', tech: 'Geohash Grid' },
  ];

  const handleSearch = async () => {
    setIsLoading(true);
    setRouteData(null);
    try {
      const res = await searchNearestWorkers(
        customerLocation.lat,
        customerLocation.lng,
        selectedSkill,
        topK,
        searchAlgo
      );
      setSearchResults(res.results || []);
      setSearchStats(res.stats || null);
      setHasSearched(true);

      if (res.results && res.results.length > 0) {
        // Automatically select the first nearest worker
        const topOne = res.results[0];
        setSelectedWorker(topOne);
        fetchRouteForWorker(topOne);
      } else {
        setSelectedWorker(null);
      }
    } catch (err) {
      showToast(`Search failed: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteForWorker = async (worker) => {
    try {
      const routeRes = await calculateRoute(
        customerLocation.lat,
        customerLocation.lng,
        worker.lat,
        worker.lng,
        'astar'
      );
      setRouteData(routeRes);
    } catch (err) {
      console.warn('Could not calculate initial route preview:', err.message);
    }
  };

  const handleWorkerClick = (worker) => {
    setSelectedWorker(worker);
    fetchRouteForWorker(worker);
  };

  const handleMapLocationSelect = (lat, lng) => {
    const newLoc = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    };
    setCustomerLocation(newLoc);
    showToast(`Updated customer location: ${newLoc.lat}, ${newLoc.lng}`, 'info');
  };

  // Run initial search once on mount or when location changes
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Find Nearby Workers</h1>
        <p className="page-subtitle">
          Discover trusted professionals near your location in {config.cityName}. Click anywhere on the map to set your location.
        </p>
      </div>

      {/* Search Controls Bar */}
      <div className="search-controls-bar">
        <div className="controls-group">
          {/* Service Dropdown */}
          <div className="control-item">
            <label>Service</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="cleaner">Cleaner</option>
              <option value="carpenter">Carpenter</option>
              <option value="painter">Painter</option>
            </select>
          </div>

          {/* Top Results Dropdown */}
          <div className="control-item">
            <label>Top Results</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          {/* Search Method Dropdown */}
          <div className="control-item">
            <label>Search Method</label>
            <select
              value={searchAlgo}
              onChange={(e) => setSearchAlgo(e.target.value)}
            >
              {searchMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Action Button */}
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={isLoading}
        >
          <Search size={16} />
          <span>{isLoading ? 'Searching...' : 'Search'}</span>
        </button>
      </div>

      {/* Main Map & Detail Layout */}
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

            <MapViewController center={customerLocation} />
            <MapEventsHandler onLocationSelect={handleMapLocationSelect} />

            {/* Customer Location Pin */}
            <Marker
              position={[customerLocation.lat, customerLocation.lng]}
              icon={createCustomerIcon()}
            >
              <Popup>
                <strong>Your Location</strong>
                <br />
                {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
              </Popup>
            </Marker>

            {/* Background Workers (other workers) */}
            {allWorkers
              .filter(
                (w) =>
                  !searchResults.some((res) => res.id === w.id) &&
                  w.available === 1
              )
              .map((w) => (
                <Marker
                  key={`bg-${w.id}`}
                  position={[w.lat, w.lng]}
                  icon={createOtherWorkerIcon()}
                >
                  <Popup>
                    <strong>{w.name}</strong> ({w.skill})
                    <br />
                    Rating: {w.rating} ★
                  </Popup>
                </Marker>
              ))}

            {/* Top Nearest Worker Results */}
            {searchResults.map((worker, index) => {
              const isSelected = selectedWorker?.id === worker.id;
              return (
                <Marker
                  key={`res-${worker.id}`}
                  position={[worker.lat, worker.lng]}
                  icon={createWorkerBadgeIcon(index + 1, isSelected)}
                  eventHandlers={{
                    click: () => handleWorkerClick(worker),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '150px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-navy)' }}>
                        #{index + 1} {worker.name}
                      </strong>
                      <div style={{ textTransform: 'capitalize', color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.8rem', marginTop: 2 }}>
                        {worker.skill}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                        ★ {worker.rating} • {worker.distanceKm} km away
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: 8, padding: '4px 10px', fontSize: '0.75rem', width: '100%' }}
                        onClick={() => handleWorkerClick(worker)}
                      >
                        Select Worker
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Drawn Route Polyline if worker is selected */}
            {routeData && routeData.path && routeData.path.length > 0 && (
              <Polyline
                positions={routeData.path.map((p) => [p.lat, p.lng])}
                color="#2563EB"
                weight={5}
                opacity={0.85}
              />
            )}
          </MapContainer>

          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot customer" />
              <span>Your Location</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot top-result" />
              <span>Top Results</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot other-worker" />
              <span>Other Workers</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panel */}
        <div className="map-sidebar-panel">
          {/* Route Found Alert Badge */}
          {routeData && routeData.etaMinutes !== undefined && (
            <div className="route-alert-badge">
              <CheckCircle size={17} />
              <span>Route Found • ETA: {routeData.etaMinutes} min</span>
            </div>
          )}

          {/* Selected Worker Card */}
          {selectedWorker ? (
            <div className="worker-card">
              <div className="worker-header">
                <div className="worker-avatar">
                  {selectedWorker.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="worker-info-meta">
                  <h3>{selectedWorker.name}</h3>
                  <span className="skill-pill">{selectedWorker.skill}</span>
                </div>
              </div>

              <div className="worker-meta-row">
                <div className="rating-badge">
                  <Star size={15} fill="#D97706" color="#D97706" />
                  <span>{selectedWorker.rating}</span>
                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>(120+ reviews)</span>
                </div>
                <div>📍 {selectedWorker.distanceKm} km</div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--success-green)', fontWeight: 600 }}>
                <ShieldCheck size={16} />
                <span>Verified Professional • Available Now</span>
              </div>

              <button
                className="btn btn-outline"
                style={{ width: '100%', marginTop: 14 }}
                onClick={() => navigate('/route')}
              >
                <span>View Route Details</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="worker-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <AlertCircle size={32} color="#D97706" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ color: 'var(--text-navy)', fontSize: '0.95rem' }}>No available workers found</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                No available workers for this skill nearby. Try choosing another service or clicking a different location on the map.
              </p>
            </div>
          ) : null}

          {/* Search Statistics */}
          {searchStats && (
            <div className="search-stats-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                  Search Stats
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  {searchMethods.find((m) => m.value === searchAlgo)?.label}
                </span>
              </div>

              <div className="stats-grid">
                <div className="stat-pill">
                  <div className="stat-pill-label">Time</div>
                  <div className="stat-pill-val">{searchStats.executionTimeMs} ms</div>
                </div>

                <div className="stat-pill">
                  <div className="stat-pill-label">Candidates</div>
                  <div className="stat-pill-val">{searchStats.candidatesExamined}</div>
                </div>

                <div className="stat-pill">
                  <div className="stat-pill-label">Found</div>
                  <div className="stat-pill-val">{searchStats.returnedWorkers}</div>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Workers Ranked List */}
          <div className="worker-list-box">
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Nearest Candidates ({searchResults.length})
            </h4>

            <div className="worker-list-scroll">
              {searchResults.map((w, idx) => {
                const isSelected = selectedWorker?.id === w.id;
                return (
                  <div
                    key={`item-${w.id}`}
                    className={`worker-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleWorkerClick(w)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--primary-blue)' : '#E2E8F0',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-navy)' }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ★ {w.rating} • {w.skill}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-blue)' }}>
                      {w.distanceKm} km
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

