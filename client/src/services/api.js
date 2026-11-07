/**
 * Centralized API service for ALLIN client
 */

// Configurable API base for production deployment
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Server error: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.errors && Array.isArray(errorJson.errors)) {
        errorMsg = errorJson.errors.join(' ');
      } else if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {
      // fallback to statusText
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config`);
  return handleResponse(res);
}

export async function fetchAllWorkers() {
  const res = await fetch(`${API_BASE}/workers`);
  return handleResponse(res);
}

export async function searchNearestWorkers(lat, lng, skill = '', k = 3, algo = 'kdtree') {
  const params = new URLSearchParams({
    lat,
    lng,
    k,
    algo,
  });
  if (skill) params.append('skill', skill);

  const res = await fetch(`${API_BASE}/workers/nearest?${params.toString()}`);
  return handleResponse(res);
}

export async function compareSearchAlgorithms(lat, lng, skill = '', k = 3) {
  const params = new URLSearchParams({
    lat,
    lng,
    k,
  });
  if (skill) params.append('skill', skill);

  const res = await fetch(`${API_BASE}/compare?${params.toString()}`);
  return handleResponse(res);
}

export async function calculateRoute(fromLat, fromLng, toLat, toLng, algo = 'astar') {
  const params = new URLSearchParams({
    fromLat,
    fromLng,
    toLat,
    toLng,
    algo,
  });

  const res = await fetch(`${API_BASE}/route?${params.toString()}`);
  return handleResponse(res);
}

export async function compareRoutes(fromLat, fromLng, toLat, toLng) {
  const params = new URLSearchParams({
    fromLat,
    fromLng,
    toLat,
    toLng,
  });

  const res = await fetch(`${API_BASE}/route/compare?${params.toString()}`);
  return handleResponse(res);
}

export async function seedWorkers(n = 50, seed = 12345) {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ n, seed }),
  });
  return handleResponse(res);
}

export async function fetchBenchmark(sizes = [100, 1000, 10000, 50000], queries = 5) {
  const params = new URLSearchParams({
    sizes: sizes.join(','),
    queries,
  });

  const res = await fetch(`${API_BASE}/benchmark?${params.toString()}`);
  return handleResponse(res);
}

