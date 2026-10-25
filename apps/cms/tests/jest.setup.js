const fs = require('fs');
const path = require('path');

// Runs before any test module (and before @strapi/core, which loads .env
// via dotenv without overriding already-set vars) — pins the test run to a
// disposable sqlite file instead of the dev Postgres database.
const testDbPath = path.join(__dirname, '..', '.tmp', 'test.db');
fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
fs.rmSync(testDbPath, { force: true });

process.env.DATABASE_CLIENT = 'sqlite';
process.env.DATABASE_FILENAME = path.join('.tmp', 'test.db');
