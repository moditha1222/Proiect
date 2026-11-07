import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  MapPin,
  Scale,
  Navigation,
  Activity,
  Menu,
  X,
  Database,
  Zap,
  User,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedCount, setSeedCount] = useState(50);
  const [seedVal, setSeedVal] = useState(12345);
  const [isSeeding, setIsSeeding] = useState(false);

  const { toasts, triggerReseed, config } = useApp();
  const location = useLocation();

  const handleSeedSubmit = async (e) => {
    e.preventDefault();
    setIsSeeding(true);
    try {
      await triggerReseed(Number(seedCount), Number(seedVal));
      setShowSeedModal(false);
    } catch {
      // error toast handled in context
    } finally {
      setIsSeeding(false);
    }
  };

  const navItems = [
    { to: '/', label: 'Find Workers', icon: MapPin },
    { to: '/compare', label: 'Compare Search', icon: Scale },
    { to: '/route', label: 'Plan Route', icon: Navigation },
    { to: '/benchmark', label: 'Performance', icon: Activity },
  ];

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Sparkles size={22} />
          </div>
          <div className="brand-text">
            <h1>ALLIN</h1>
            <span>NEAREST WORKER & ETA</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-tagline">ALLIN</div>
          <div className="sidebar-tagline-sub">Smarter Search. Faster Service.</div>
          {/* Skyline silhouette SVG */}
          <svg className="city-silhouette" viewBox="0 0 200 40" fill="currentColor">
            <path d="M0,40 L0,28 L8,28 L8,22 L16,22 L16,30 L25,30 L25,18 L34,18 L34,32 L40,32 L40,14 L50,14 L50,26 L60,26 L60,10 L70,10 L70,28 L80,28 L80,8 L92,8 L92,30 L104,30 L104,16 L115,16 L115,28 L125,28 L125,6 L138,6 L138,32 L150,32 L150,18 L160,18 L160,26 L175,26 L175,12 L188,12 L188,32 L200,32 L200,40 Z" />
          </svg>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="header-title-box">
              <h2>
                ALLIN <span className="desktop-only-sub" style={{ color: '#94A3B8', fontWeight: 400 }}>| Nearest Worker Search & ETA Engine</span>
              </h2>
            </div>
            <span className="header-badge">{config.cityName || 'Demo City'}</span>
          </div>

          <div className="header-right">
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => setShowSeedModal(true)}
              title="Reseed Worker Database"
            >
              <Database size={15} />
              <span>Reseed Data</span>
            </button>

            <div className="feature-pill">
              <Zap size={14} />
              <span>Find · Compare · Reach Faster</span>
            </div>

            <div className="user-profile-badge" title="Academic CSE Project">
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      {/* Reseed Dialog Modal */}
      {showSeedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{ width: '420px', maxWidth: '90vw' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-navy)' }}>Reseed Worker Dataset</h3>
              <button
                onClick={() => setShowSeedModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSeedSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                  Number of Workers (n)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50000"
                  value={seedCount}
                  onChange={(e) => setSeedCount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                  Random Seed (Deterministic PRNG)
                </label>
                <input
                  type="number"
                  value={seedVal}
                  onChange={(e) => setSeedVal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSeedModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSeeding}
                >
                  {isSeeding ? 'Generating...' : 'Seed Workers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
