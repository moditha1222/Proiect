import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Play,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchBenchmark } from '../services/api';

export default function BenchmarkPage() {
  const { showToast } = useApp();
  const [isLogScale, setIsLogScale] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([100, 1000, 10000, 50000]);

  const executeBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBenchmark(selectedSizes, 5);
      setBenchmarkData(res);
      showToast('Empirical benchmark completed successfully!', 'success');
    } catch (err) {
      showToast(`Benchmark error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeBenchmark();
  }, []);

  // Format line chart data
  const searchChartData = benchmarkData?.searchBenchmark?.map((item) => ({
    sizeLabel: item.label,
    size: item.size,
    'Basic Search (Naive)': item.naiveTimeMs,
    'Smart Location Search (KD-Tree)': item.kdTreeTimeMs,
    'Area-Based Search (Geohash)': item.geohashTimeMs,
    naiveCandidates: item.naiveCandidates,
    kdTreeCandidates: item.kdTreeCandidates,
    geohashCandidates: item.geohashCandidates,
  })) || [];

  // Format bar chart data for routing
  const routeChartData = benchmarkData?.routingBenchmark?.pairs?.map((p) => ({
    queryLabel: `Route #${p.queryIndex}`,
    'Complete Route Search (Dijkstra)': p.dijkstraNodesExplored,
    'Smart Route Search (A*)': p.astarNodesExplored,
    etaDiff: Math.abs(p.dijkstraEta - p.astarEta).toFixed(2),
  })) || [];

  const routeAverages = benchmarkData?.routingBenchmark?.averages;

  // Find fastest method on the largest dataset tested
  const largestData = benchmarkData?.searchBenchmark?.[benchmarkData?.searchBenchmark?.length - 1];
  let fastestMethod = 'Smart Location Search';
  if (largestData) {
    if (largestData.kdTreeTimeMs <= largestData.geohashTimeMs && largestData.kdTreeTimeMs <= largestData.naiveTimeMs) {
      fastestMethod = 'Smart Location Search (KD-Tree)';
    } else if (largestData.geohashTimeMs <= largestData.kdTreeTimeMs) {
      fastestMethod = 'Area-Based Search (Geohash Grid)';
    } else {
      fastestMethod = 'Basic Search (Naive)';
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Performance Benchmark</h1>
          <p className="page-subtitle">
            See how our spatial indexing and graph routing algorithms scale as datasets grow.
          </p>
        </div>

        {/* Scale Toggle & Run Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${!isLogScale ? 'active' : ''}`}
              onClick={() => setIsLogScale(false)}
            >
              Linear
            </button>
            <button
              className={`toggle-btn ${isLogScale ? 'active' : ''}`}
              onClick={() => setIsLogScale(true)}
            >
              Log Scale
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={executeBenchmark}
            disabled={isLoading}
          >
            <Play size={15} fill="currentColor" />
            <span>{isLoading ? 'Running Benchmark...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Zap size={16} color="var(--primary-blue)" />
            <span>Fastest at 50K</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-navy)', marginTop: 8 }}>
            {fastestMethod}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
            {largestData ? `${largestData.kdTreeTimeMs} ms vs ${largestData.naiveTimeMs} ms (Naive)` : 'Measuring...'}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Cpu size={16} color="var(--success-green)" />
            <span>Spatial Pruning Gain</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-green)', marginTop: 8 }}>
            {largestData && largestData.naiveCandidates > 0
              ? `${(
                  ((largestData.naiveCandidates - largestData.kdTreeCandidates) /
                    largestData.naiveCandidates) *
                  100
                ).toFixed(1)}%`
              : '--'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
            Fewer candidate workers examined
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Activity size={16} color="var(--purple)" />
            <span>A* Route Exploration</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--purple)', marginTop: 8 }}>
            {routeAverages ? `-${routeAverages.reductionPercent}%` : '--'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
            {routeAverages
              ? `${routeAverages.astarNodesExplored} nodes (A*) vs ${routeAverages.dijkstraNodesExplored} (Dijkstra)`
              : 'Calculating...'}
          </div>
        </div>
      </div>

      {/* Two Benchmark Charts Grid */}
      <div className="benchmark-charts-grid">
        {/* Chart 1: Nearest Worker Search Time vs Workers */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <SearchIcon size={18} color="var(--primary-blue)" />
                <span>Search Time vs Number of Workers</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Average query execution time across 5 queries per dataset size
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isLogScale ? 'Logarithmic (ms)' : 'Linear (ms)'}
            </span>
          </div>

          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={searchChartData} margin={{ top: 10, right: 25, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="sizeLabel" stroke="#94A3B8" />
                <YAxis
                  scale={isLogScale ? 'log' : 'auto'}
                  domain={isLogScale ? [0.1, 'auto'] : [0, 'auto']}
                  stroke="#94A3B8"
                  unit="ms"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(val) => [`${val} ms`, '']}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Line
                  type="monotone"
                  dataKey="Basic Search (Naive)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Smart Location Search (KD-Tree)"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Area-Based Search (Geohash)"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Route Search Nodes Explored */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <Layers size={18} color="var(--success-green)" />
                <span>Route Search – Locations Checked</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Comparing map graph nodes settled by Dijkstra vs A* on 2,500-node city graph
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Graph: 50×50 (2,500 nodes)
            </span>
          </div>

          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeChartData} margin={{ top: 10, right: 25, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="queryLabel" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(val) => [`${val} nodes`, '']}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar
                  dataKey="Complete Route Search (Dijkstra)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Smart Route Search (A*)"
                  fill="#16A34A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Index Construction Times Table & Educational Information */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Index Construction Times Card */}
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: 12 }}>
            One-Time Spatial Index Build Times
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Indexes are constructed once upon seeding or server start, and cached in memory for sub-millisecond query execution.
          </p>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Dataset Size</th>
                <th>KD-Tree Build</th>
                <th>Geohash Grid Build</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData?.searchBenchmark?.map((item) => (
                <tr key={item.size}>
                  <td style={{ fontWeight: 600 }}>{item.size.toLocaleString()} workers</td>
                  <td>{item.buildTimes?.kdTreeMs} ms</td>
                  <td>{item.buildTimes?.geohashMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Theoretical Analysis Card */}
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: 12 }}>
            Empirical Findings & Academic Takeaways
          </h4>
          <ul style={{ paddingLeft: 18, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <li>
              <strong>Linear Scaling in Naive Search:</strong> Without spatial indexing, query time scales linearly with N. At 50,000 workers, naive scan must evaluate all candidates.
            </li>
            <li>
              <strong>Logarithmic Scaling with KD-Tree:</strong> The 3D unit-sphere KD-Tree prunes vast geographic regions whose minimum chord distance exceeds the top-K bound, keeping query times under 2–4 ms even at 50K workers.
            </li>
            <li>
              <strong>Admissible Heuristic in A*:</strong> Dividing great-circle distance by the maximum road speed (60 km/h) creates a provably admissible and consistent heuristic. A* finds the identical optimal travel time as Dijkstra while settling 50–70% fewer nodes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SearchIcon(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke={props.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

