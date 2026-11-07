/**
 * Request validation utilities for ALLIN API
 */

const { SKILLS } = require('../services/seedService');

const VALID_SEARCH_ALGOS = ['naive', 'kdtree', 'geohash'];
const VALID_ROUTE_ALGOS = ['dijkstra', 'astar'];
const MAX_WORKERS = Number(process.env.MAX_WORKERS) || 100000;

function isValidCoordinate(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90.0 &&
    nLat <= 90.0 &&
    nLng >= -180.0 &&
    nLng <= 180.0
  );
}

function validateNearestParams(query) {
  const errors = [];
  const { lat, lng, skill, k, algo } = query;

  if (lat === undefined || lng === undefined) {
    errors.push('Parameters "lat" and "lng" are required.');
  } else if (!isValidCoordinate(lat, lng)) {
    errors.push('Invalid coordinates: lat must be in [-90, 90] and lng in [-180, 180].');
  }

  if (skill !== undefined && skill !== '') {
    const s = skill.trim().toLowerCase();
    if (!SKILLS.includes(s)) {
      errors.push(`Invalid skill "${skill}". Supported skills are: ${SKILLS.join(', ')}.`);
    }
  }

  const parsedK = k !== undefined ? parseInt(k, 10) : 3;
  if (isNaN(parsedK) || parsedK <= 0 || parsedK > 100) {
    errors.push('Parameter "k" must be a positive integer between 1 and 100.');
  }

  const parsedAlgo = (algo || 'kdtree').toLowerCase();
  if (!VALID_SEARCH_ALGOS.includes(parsedAlgo)) {
    errors.push(`Invalid algorithm "${algo}". Allowed algorithms: ${VALID_SEARCH_ALGOS.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      lat: Number(lat),
      lng: Number(lng),
      skill: skill ? skill.trim().toLowerCase() : '',
      k: parsedK,
      algo: parsedAlgo,
    },
  };
}

function validateRouteParams(query) {
  const errors = [];
  const { fromLat, fromLng, toLat, toLng, algo } = query;

  if (fromLat === undefined || fromLng === undefined) {
    errors.push('Parameters "fromLat" and "fromLng" are required.');
  } else if (!isValidCoordinate(fromLat, fromLng)) {
    errors.push('Invalid start coordinates: fromLat in [-90, 90], fromLng in [-180, 180].');
  }

  if (toLat === undefined || toLng === undefined) {
    errors.push('Parameters "toLat" and "toLng" are required.');
  } else if (!isValidCoordinate(toLat, toLng)) {
    errors.push('Invalid destination coordinates: toLat in [-90, 90], toLng in [-180, 180].');
  }

  const parsedAlgo = (algo || 'astar').toLowerCase();
  if (!VALID_ROUTE_ALGOS.includes(parsedAlgo)) {
    errors.push(`Invalid algorithm "${algo}". Allowed routing algorithms: ${VALID_ROUTE_ALGOS.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      fromLat: Number(fromLat),
      fromLng: Number(fromLng),
      toLat: Number(toLat),
      toLng: Number(toLng),
      algo: parsedAlgo,
    },
  };
}

function validateSeedParams(body) {
  const errors = [];
  const { n, seed } = body || {};

  const parsedN = n !== undefined ? parseInt(n, 10) : 50;
  if (isNaN(parsedN) || parsedN <= 0 || parsedN > MAX_WORKERS) {
    errors.push(`Worker count "n" must be an integer between 1 and ${MAX_WORKERS}.`);
  }

  const parsedSeed = seed !== undefined ? parseInt(seed, 10) : 12345;
  if (isNaN(parsedSeed)) {
    errors.push('Parameter "seed" must be a valid integer.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      n: parsedN,
      seed: parsedSeed,
    },
  };
}

function validateBenchmarkParams(query) {
  const errors = [];
  const { sizes } = query;

  let parsedSizes = [100, 1000, 10000, 50000];

  if (sizes) {
    const rawList = String(sizes).split(',').map((s) => s.trim());
    parsedSizes = [];
    for (const item of rawList) {
      const val = parseInt(item, 10);
      if (isNaN(val) || val <= 0 || val > MAX_WORKERS) {
        errors.push(`Invalid benchmark size "${item}". Must be an integer between 1 and ${MAX_WORKERS}.`);
      } else {
        parsedSizes.push(val);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      sizes: parsedSizes,
    },
  };
}

module.exports = {
  isValidCoordinate,
  validateNearestParams,
  validateRouteParams,
  validateSeedParams,
  validateBenchmarkParams,
};

