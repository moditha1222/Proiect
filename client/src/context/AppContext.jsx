import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchConfig, seedWorkers, fetchAllWorkers } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // App Config
  const [config, setConfig] = useState({
    cityName: 'Guntur',
    centerLat: 16.3067,
    centerLng: 80.4365,
    defaultWorkers: 50,
    skills: ['plumber', 'electrician', 'cleaner', 'carpenter', 'painter'],
  });

  // Customer Location (persisted across pages)
  const [customerLocation, setCustomerLocation] = useState({
    lat: 16.3067,
    lng: 80.4365,
  });

  // Search parameters
  const [selectedSkill, setSelectedSkill] = useState('plumber');
  const [topK, setTopK] = useState(3);
  const [searchAlgo, setSearchAlgo] = useState('kdtree');

  // Currently selected worker for routing
  const [selectedWorker, setSelectedWorker] = useState(null);

  // All workers currently in database (for background map markers)
  const [allWorkers, setAllWorkers] = useState([]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadInitialData = async () => {
    try {
      const cfg = await fetchConfig();
      setConfig(cfg);
      setCustomerLocation({ lat: cfg.centerLat, lng: cfg.centerLng });

      const workersRes = await fetchAllWorkers();
      if (workersRes.workers) {
        setAllWorkers(workersRes.workers);
      }
    } catch (err) {
      console.warn('Initial config load failed, using defaults:', err.message);
    }
  };

  const triggerReseed = async (n = 50, seed = 12345) => {
    try {
      const res = await seedWorkers(n, seed);
      const workersRes = await fetchAllWorkers();
      setAllWorkers(workersRes.workers || []);
      showToast(`Database reseeded with ${n} workers (seed: ${seed})`, 'success');
      return res;
    } catch (err) {
      showToast(`Failed to seed: ${err.message}`, 'error');
      throw err;
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <AppContext.Provider
      value={{
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
        setAllWorkers,
        toasts,
        showToast,
        triggerReseed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

