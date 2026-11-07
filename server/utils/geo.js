/**
 * Geographic calculation utilities for ALLIN
 */

const EARTH_RADIUS_KM = 6371.0;

function degToRad(deg) {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad) {
  return (rad * 180.0) / Math.PI;
}

/**
 * Standard Haversine formula
 * Returns distance in kilometers between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const phi1 = degToRad(lat1);
  const phi2 = degToRad(lat2);
  const deltaPhi = degToRad(lat2 - lat1);
  const deltaLambda = degToRad(lng2 - lng1);

  const sinDeltaPhiHalf = Math.sin(deltaPhi / 2);
  const sinDeltaLambdaHalf = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhiHalf * sinDeltaPhiHalf +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambdaHalf * sinDeltaLambdaHalf;

  // Numerical safeguard for precision issues
  const clampedA = Math.min(1.0, Math.max(0.0, a));
  const c = 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1.0 - clampedA));

  return EARTH_RADIUS_KM * c;
}

/**
 * Maps lat/lng to 3D Cartesian coordinates on the unit sphere
 */
function toUnitSphere(lat, lng) {
  const phi = degToRad(lat);
  const lambda = degToRad(lng);
  const cosPhi = Math.cos(phi);
  return {
    x: cosPhi * Math.cos(lambda),
    y: cosPhi * Math.sin(lambda),
    z: Math.sin(phi),
  };
}

/**
 * Euclidean chord distance squared in 3D unit sphere space
 */
function chordDistanceSq(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return dx * dx + dy * dy + dz * dz;
}

function chordDistance(p1, p2) {
  return Math.sqrt(chordDistanceSq(p1, p2));
}

/**
 * Converts chord distance on unit sphere to Haversine distance in km
 * d = 2 * R * asin(c / 2)
 */
function chordToHaversine(chord) {
  const clamped = Math.min(2.0, Math.max(0.0, chord));
  return 2.0 * EARTH_RADIUS_KM * Math.asin(clamped / 2.0);
}

/**
 * Converts Haversine distance in km to chord distance on unit sphere
 * c = 2 * sin(d / (2 * R))
 */
function haversineToChord(dKm) {
  const theta = dKm / EARTH_RADIUS_KM;
  return 2.0 * Math.sin(theta / 2.0);
}

/**
 * Minimum Haversine distance from query point (lat, lng) to a bounding box
 * bbox: { minLat, maxLat, minLng, maxLng }
 */
function minDistToBoundingBox(lat, lng, bbox) {
  // Clamp query lat/lng to the bounding box boundaries
  const clampedLat = Math.max(bbox.minLat, Math.min(lat, bbox.maxLat));
  let clampedLng = Math.max(bbox.minLng, Math.min(lng, bbox.maxLng));

  return haversineDistance(lat, lng, clampedLat, clampedLng);
}

module.exports = {
  EARTH_RADIUS_KM,
  degToRad,
  radToDeg,
  haversineDistance,
  toUnitSphere,
  chordDistance,
  chordDistanceSq,
  chordToHaversine,
  haversineToChord,
  minDistToBoundingBox,
};

