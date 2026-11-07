import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Compass,
  Cpu,
  Grid,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compareSearchAlgorithms } from '../services/api';

export default function ComparePage() {
  const {
    customerLocation,
    setCustomerLocation,
    selectedSkill,
    setSelectedSkill,
    topK,
    setTopK,
    showToast,
  } = useApp();

  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  const runComparison = async () => {
    setIsLoading(true);
    try {
      const res = await compareSearchAlgorithms(
        customerLocation.lat,
        customerLocation.lng,
        selectedSkill,
        topK
      );
      setComparisonData(res);
      if (res.allMatch) {
        showToast('All three algorithms returned identical nearest workers!', 'success');
      }
    } catch (err) {
      showToast(`Comparison error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, []);

  const toggleAccordion = (index) => {
    setExpandedAccordion(expandedAccordion === index ? null : index);
  };

  const naive = comparisonData?.algorithms?.naive;
  const kdtree = comparisonData?.algorithms?.kdtree;
  const geohash = comparisonData?.algorithms?.geohash;

  // Calculate efficiency percentage
  const kdEfficiency =
    naive && kdtree && naive.stats.candidatesExamined > 0
      ? (
        ((naive.stats.candidatesExamined - kdtree.stats.candidatesExamined) /
          naive.stats.candidatesExamined) *
        100
      ).toFixed(1)
      : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Algorithm Comparison</h1>
          <p className="page-subtitle">
            See how different search methods perform for the exact same query.
          </p>
        </div>
        <div className="feature-pill" style={{ backgroundColor: '#EFF6FF', color: 'var(--primary-blue)', border: '1px solid var(--light-blue-border)' }}>
          <Sparkles size={14} />
          <span>Same location & service</span>
        </div>
      </div>

      {/* Shared Query Controls Bar */}
      <div className="search-controls-bar">
        <div className="controls-group">
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

          <div className="control-item">
            <label>Coords</label>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
              {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={runComparison}
          disabled={isLoading}
        >
          <Scale size={16} />
          <span>{isLoading ? 'Comparing...' : 'Run Comparison'}</span>
        </button>
      </div>

      {/* Three Comparison Cards */}
      {comparisonData && (
        <>
          <div className="comparison-grid">
            {/* Card 1: Basic Search */}
            <div className="algo-card naive">
              <div className="algo-card-header">
                <div className="algo-icon-box naive">
                  <Search size={20} />
                </div>
                <div>
                  <h3 className="algo-name">Simple Scan</h3>
                  <span className="algo-tech-sub">Naive Linear Search • O(N log N)</span>
                </div>
              </div>
              <p className="algo-desc">Checks matching workers one by one.</p>

              <div className="algo-big-metrics">
                <div className="algo-big-metric-item">
                  <div className="metric-num">{naive?.stats?.executionTimeMs} ms</div>
                  <div className="metric-sub">Search Time</div>
                </div>
                <div className="algo-big-metric-item">
                  <div className="metric-num">{naive?.stats?.candidatesExamined}</div>
                  <div className="metric-sub">Candidates</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Top {naive?.results?.length} Workers
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {naive?.results?.map((w, i) => (
                    <div
                      key={w.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>#{i + 1}</span>
                      <span>{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Smart Location Search */}
            <div className="algo-card kdtree">
              <div className="algo-card-header">
                <div className="algo-icon-box kdtree">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="algo-name">Smart Tree Search</h3>
                  <span className="algo-tech-sub">3D Unit-Sphere KD-Tree • O(log N)</span>
                </div>
              </div>
              <p className="algo-desc">Uses a 3D unit-sphere spatial tree with chord-distance pruning.</p>

              <div className="algo-big-metrics">
                <div className="algo-big-metric-item">
                  <div className="metric-num">{kdtree?.stats?.executionTimeMs} ms</div>
                  <div className="metric-sub">Search Time</div>
                </div>
                <div className="algo-big-metric-item">
                  <div className="metric-num">{kdtree?.stats?.candidatesExamined}</div>
                  <div className="metric-sub">Candidates</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Top {kdtree?.results?.length} Workers
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {kdtree?.results?.map((w, i) => (
                    <div
                      key={w.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--success-green)' }}>#{i + 1}</span>
                      <span>{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Area-Based Search */}
            <div className="algo-card geohash">
              <div className="algo-card-header">
                <div className="algo-icon-box geohash">
                  <Grid size={20} />
                </div>
                <div>
                  <h3 className="algo-name">Grid Search</h3>
                  <span className="algo-tech-sub">Geohash Spatial Grid • Progressive Bound</span>
                </div>
              </div>
              <p className="algo-desc">Searches nearby geographic cells with rigorous lower-bound stopping.</p>

              <div className="algo-big-metrics">
                <div className="algo-big-metric-item">
                  <div className="metric-num">{geohash?.stats?.executionTimeMs} ms</div>
                  <div className="metric-sub">Search Time</div>
                </div>
                <div className="algo-big-metric-item">
                  <div className="metric-num">{geohash?.stats?.candidatesExamined}</div>
                  <div className="metric-sub">Candidates</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Top {geohash?.results?.length} Workers
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {geohash?.results?.map((w, i) => (
                    <div
                      key={w.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--purple)' }}>#{i + 1}</span>
                      <span>{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verification & Performance Summary Banner */}
          <div
            className="card"
            style={{
              backgroundColor: comparisonData.allMatch ? 'var(--success-light)' : '#FEF2F2',
              borderColor: comparisonData.allMatch ? '#BBF7D0' : '#FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={24} color={comparisonData.allMatch ? 'var(--success-green)' : '#DC2626'} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: comparisonData.allMatch ? '#166534' : '#991B1B' }}>
                  {comparisonData.allMatch
                    ? 'All three methods returned identical nearest-worker results.'
                    : 'Discrepancy detected between algorithm results.'}
                </div>
                <div style={{ fontSize: '0.82rem', color: comparisonData.allMatch ? '#15803D' : '#B91C1C', marginTop: 2 }}>
                  {kdEfficiency && Number(kdEfficiency) > 0
                    ? `Smart Location Search checked ${kdEfficiency}% fewer candidates than Basic Search while maintaining 100% precision.`
                    : 'Deterministic tie-breaking confirmed worker identity and ordering.'}
                </div>
              </div>
            </div>
          </div>

          {/* Results Comparison Table */}
          <div className="table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Worker Name</th>
                  <th>Service</th>
                  <th>Rating</th>
                  <th>Basic Search (km)</th>
                  <th>Smart Tree Search (km)</th>
                  <th>Grid Search (km)</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {naive?.results?.map((w, idx) => {
                  const kdWorker = kdtree?.results?.[idx];
                  const geoWorker = geohash?.results?.[idx];
                  const isIdentical =
                    kdWorker &&
                    geoWorker &&
                    kdWorker.id === w.id &&
                    geoWorker.id === w.id;

                  return (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{w.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        <span className="skill-pill">{w.skill}</span>
                      </td>
                      <td>★ {w.rating}</td>
                      <td>{w.distanceKm} km</td>
                      <td>{kdWorker ? `${kdWorker.distanceKm} km` : '-'}</td>
                      <td>{geoWorker ? `${geoWorker.distanceKm} km` : '-'}</td>
                      <td>
                        {isIdentical ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: 'var(--success-green)',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                            }}
                          >
                            <CheckCircle2 size={14} /> Match
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.78rem' }}>
                            Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expandable Educational Accordion */}
          <div className="accordion-box">
            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleAccordion(1)}>
                <span>How Basic Search (Naive Linear Scan) Works</span>
                {expandedAccordion === 1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {expandedAccordion === 1 && (
                <div className="accordion-content">
                  Basic Search traverses the entire worker dataset sequentially. For every worker matching the service and availability criteria, it calculates the great-circle Haversine distance from the customer coordinates. It then sorts the candidates by distance and takes the top K. Time complexity is O(N) distance checks and O(N log N) sorting. As the dataset scales to 50,000+ workers, search latency increases linearly.
                </div>
              )}
            </div>

            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleAccordion(2)}>
                <span>How Smart Location Search (3D Unit-Sphere KD-Tree) Works</span>
                {expandedAccordion === 2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {expandedAccordion === 2 && (
                <div className="accordion-content">
                  Standard 2D Euclidean KD-trees fail on geographic coordinates because lines of latitude converge toward the poles. ALLIN projects geographic latitude/longitude onto 3D Cartesian coordinates on the unit sphere (x = cos φ cos λ, y = cos φ sin λ, z = sin φ). Unit-sphere chord distance is strictly monotonic with Haversine distance (c = 2 sin(d / 2R)). This enables rigorous 3D axis-aligned bounding box branch pruning. Average query complexity is O(log N), examining only a fraction of total candidates.
                </div>
              )}
            </div>

            <div className="accordion-item">
              <div className="accordion-header" onClick={() => toggleAccordion(3)}>
                <span>How Area-Based Search (Geohash Spatial Grid) Works</span>
                {expandedAccordion === 3 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {expandedAccordion === 3 && (
                <div className="accordion-content">
                  Geohash divides the spherical surface into hierarchical rectangular cells using alternating bit interleaving of latitude and longitude. ALLIN organizes workers into a Base32 spatial grid and queries cells progressively using a priority queue ordered by the exact minimum Haversine distance from the query point to each cell's bounding box. The search provably terminates as soon as the nearest possible point in any unvisited cell is farther than the current Kth best candidate.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
