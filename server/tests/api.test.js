import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { seedDatabase } from '../services/seedService';
import spatialIndexManager from '../services/spatialIndexManager';

describe('ALLIN REST API Endpoints & Validation', () => {
  beforeAll(() => {
    seedDatabase(50, 12345);
    spatialIndexManager.refresh();
  });

  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/config returns city configuration', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.cityName).toBeDefined();
    expect(res.body.centerLat).toBeDefined();
    expect(res.body.centerLng).toBeDefined();
  });

  it('GET /api/workers/nearest with valid parameters returns results', async () => {
    const res = await request(app)
      .get('/api/workers/nearest')
      .query({ lat: 16.3067, lng: 80.4365, skill: 'plumber', k: 3, algo: 'kdtree' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.algorithm).toBe('kdtree');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.candidatesExamined).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/workers/nearest returns 400 for invalid coordinates', async () => {
    const res = await request(app)
      .get('/api/workers/nearest')
      .query({ lat: 195.0, lng: 80.0, skill: 'plumber' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('GET /api/workers/nearest returns 400 for invalid skill', async () => {
    const res = await request(app)
      .get('/api/workers/nearest')
      .query({ lat: 16.30, lng: 80.43, skill: 'rocket_scientist' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/compare executes all three algorithms and confirms match', async () => {
    const res = await request(app)
      .get('/api/compare')
      .query({ lat: 16.3067, lng: 80.4365, skill: 'plumber', k: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.allMatch).toBe(true);
    expect(res.body.algorithms.naive).toBeDefined();
    expect(res.body.algorithms.kdtree).toBeDefined();
    expect(res.body.algorithms.geohash).toBeDefined();
  });

  it('GET /api/route returns path and ETA', async () => {
    const res = await request(app)
      .get('/api/route')
      .query({
        fromLat: 16.30,
        fromLng: 80.43,
        toLat: 16.32,
        toLng: 80.45,
        algo: 'astar',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.algorithm).toBe('astar');
    expect(Array.isArray(res.body.path)).toBe(true);
    expect(res.body.etaMinutes).toBeGreaterThan(0);
  });

  it('POST /api/seed reseeds dataset deterministically', async () => {
    const res = await request(app)
      .post('/api/seed')
      .send({ n: 25, seed: 777 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalWorkers).toBe(25);
  });

  it('POST /api/seed returns 400 for invalid n', async () => {
    const res = await request(app)
      .post('/api/seed')
      .send({ n: -5, seed: 123 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

