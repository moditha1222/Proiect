import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import FindWorkersPage from './pages/FindWorkersPage';
import ComparePage from './pages/ComparePage';
import RoutePage from './pages/RoutePage';
import BenchmarkPage from './pages/BenchmarkPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<FindWorkersPage />} />
            <Route path="map" element={<FindWorkersPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="route" element={<RoutePage />} />
            <Route path="benchmark" element={<BenchmarkPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
