const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Determine database path, configurable via environment variable
const defaultDbPath = path.resolve(__dirname, '../../database.sqlite');
const dbPath = process.env.DB_PATH || defaultDbPath;

// Establish SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    // Enable foreign key constraints in SQLite
    db.run('PRAGMA foreign_keys = ON;');
  }
});

/**
 * Execute a SQL query (INSERT, UPDATE, DELETE) wrapped in a Promise.
 * Resolves with an object containing `id` (or `lastID`) and `changes`.
 *
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<{ id: number, lastID: number, changes: number }>}
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Execute a SQL query to fetch a single row wrapped in a Promise.
 * Resolves with the single row object, or undefined if no record is found.
 *
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Object|undefined>}
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Execute a SQL query to fetch all matching rows wrapped in a Promise.
 * Resolves with an array of row objects.
 *
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Array<Object>>}
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Execute a SQL query processing each row via a callback, wrapped in a Promise.
 * Resolves with the count of rows processed.
 *
 * @param {string} sql
 * @param {Array} [params]
 * @param {Function} callback
 * @returns {Promise<number>}
 */
function each(sql, params = [], callback) {
  return new Promise((resolve, reject) => {
    db.each(sql, params, callback, (err, count) => {
      if (err) {
        reject(err);
      } else {
        resolve(count);
      }
    });
  });
}

/**
 * Execute multiple SQL statements (e.g., schema definitions) wrapped in a Promise.
 *
 * @param {string} sql
 * @returns {Promise<void>}
 */
function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Close the database connection wrapped in a Promise.
 *
 * @returns {Promise<void>}
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  each,
  exec,
  close
};
