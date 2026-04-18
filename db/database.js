/**
 * db/database.js
 * Inicializa la base de datos SQLite y exporta la instancia.
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'pikachu.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Habilitar WAL mode para mejor performance concurrente
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ejecutar schema si la BD es nueva
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log(`📦 Base de datos SQLite lista: ${DB_PATH}`);

module.exports = db;
