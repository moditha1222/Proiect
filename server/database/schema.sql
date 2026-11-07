CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  skill TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  rating REAL NOT NULL,
  available INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workers_skill_avail ON workers (skill, available);
CREATE INDEX IF NOT EXISTS idx_workers_coords ON workers (lat, lng);

