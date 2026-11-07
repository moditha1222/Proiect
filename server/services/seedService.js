/**
 * Deterministic Seeding Service for ALLIN
 * Generates reproducible worker datasets with realistic names, skills, ratings,
 * and geographic distributions around the configured city center.
 */

const db = require('../database/db');
require('dotenv').config();

const FIRST_NAMES = [
  'Rohit', 'Priya', 'Suresh', 'Rajesh', 'Anita', 'Vikram', 'Deepa', 'Amit',
  'Sunita', 'Manoj', 'Pooja', 'Rahul', 'Sneha', 'Ramesh', 'Kavita', 'Arjun',
  'Meera', 'Dinesh', 'Neha', 'Sanjay', 'Lakshmi', 'Ajay', 'Divya', 'Ravi',
  'Anjali', 'Karthik', 'Swati', 'Naveen', 'Ritu', 'Harish', 'Bhavna', 'Vinod',
  'Shilpa', 'Alok', 'Madhavi', 'Gaurav', 'Shweta', 'Prateek', 'Pallavi', 'Santosh'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Verma', 'Singh', 'Reddy', 'Rao', 'Nair',
  'Gupta', 'Das', 'Joshi', 'Mehta', 'Choudhury', 'Pillai', 'Iyer', 'Kulkarni',
  'Bhat', 'Nambiar', 'Deshmukh', 'Prasad', 'Menon', 'Venkatesh', 'Bose', 'Mishra'
];

const SKILLS = ['plumber', 'electrician', 'cleaner', 'carpenter', 'painter'];

function createPrng(seed = 12345) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an array of worker records using a deterministic PRNG
 */
function generateDeterministicWorkers(count, seed = 12345, centerLat = 16.3067, centerLng = 80.4365) {
  const prng = createPrng(seed);
  const workers = [];

  // Spread roughly 10-12 km radius around city center
  // ~0.09 degrees latitude is approx 10 km
  const radiusLat = 0.085;
  const radiusLng = 0.095;

  for (let i = 1; i <= count; i++) {
    const fIdx = Math.floor(prng() * FIRST_NAMES.length);
    const lIdx = Math.floor(prng() * LAST_NAMES.length);
    const name = `${FIRST_NAMES[fIdx]} ${LAST_NAMES[lIdx]}`;

    const skill = SKILLS[Math.floor(prng() * SKILLS.length)];

    // Box-Muller style or clustered distribution for natural urban density
    const angle = prng() * 2 * Math.PI;
    const r = Math.sqrt(prng()); // uniform disk distribution
    const lat = Number((centerLat + r * radiusLat * Math.sin(angle)).toFixed(6));
    const lng = Number((centerLng + r * radiusLng * Math.cos(angle)).toFixed(6));

    // Ratings between 3.0 and 5.0
    const rating = Number((3.0 + prng() * 2.0).toFixed(1));

    // Availability: ~78% available
    const available = prng() < 0.78 ? 1 : 0;

    workers.push({
      id: i,
      name,
      skill,
      lat,
      lng,
      rating,
      available,
    });
  }

  return workers;
}

/**
 * Seeds the SQLite database with deterministic workers
 */
function seedDatabase(count = 50, seed = 12345) {
  const centerLat = Number(process.env.CITY_CENTER_LAT) || 16.3067;
  const centerLng = Number(process.env.CITY_CENTER_LNG) || 80.4365;

  const workers = generateDeterministicWorkers(count, seed, centerLat, centerLng);

  const insert = db.prepare(`
    INSERT INTO workers (id, name, skill, lat, lng, rating, available)
    VALUES (@id, @name, @skill, @lat, @lng, @rating, @available)
  `);

  const deleteExisting = db.prepare('DELETE FROM workers');

  const seedTransaction = db.transaction((rows) => {
    deleteExisting.run();
    for (const row of rows) {
      insert.run(row);
    }
  });

  seedTransaction(workers);

  return workers;
}

module.exports = {
  SKILLS,
  createPrng,
  generateDeterministicWorkers,
  seedDatabase,
};

