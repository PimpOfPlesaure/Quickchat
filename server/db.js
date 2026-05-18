const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './quickchat.db';
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    NOT NULL UNIQUE,
    pass_hash TEXT    NOT NULL,
    last_seen INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS groups (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER NOT NULL REFERENCES groups(id),
    user_id  INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id  INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER,
    group_id   INTEGER,
    content    TEXT    NOT NULL,
    timestamp  INTEGER NOT NULL,
    delivered  INTEGER DEFAULT 0
  );
`);

module.exports = db;
