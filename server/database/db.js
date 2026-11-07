const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Support both DATABASE_PATH (Render standard) and DB_PATH
const configuredPath = process.env.DATABASE_PATH || process.env.DB_PATH;

const dbPath =
  process.env.NODE_ENV === 'test' && !process.env.TEST_PERSIST
    ? ':memory:'
    : configuredPath
    ? path.resolve(configuredPath)
    : path.join(__dirname, 'allin.db');

// Ensure parent directory exists for persistent container volumes (e.g. Render Persistent Disk)
if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new Database(dbPath);

// Enable WAL mode for high-performance concurrent reads/writes
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Initialize tables if they do not exist
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
module.exports.dbPath = dbPath;
