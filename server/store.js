import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { generateSecret, generateShareCode } from "./id.js";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "wizard.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    share_code TEXT PRIMARY KEY,
    admin_secret TEXT NOT NULL,
    state TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

const insertStmt = db.prepare(
  "INSERT INTO games (share_code, admin_secret, state, updated_at) VALUES (?, ?, ?, ?)",
);
const selectStmt = db.prepare("SELECT * FROM games WHERE share_code = ?");
const updateStmt = db.prepare("UPDATE games SET state = ?, updated_at = ? WHERE share_code = ?");

export function insertGame(state) {
  let shareCode = generateShareCode();
  while (selectStmt.get(shareCode)) {
    shareCode = generateShareCode();
  }
  const adminSecret = generateSecret();
  insertStmt.run(shareCode, adminSecret, JSON.stringify(state), Date.now());
  return { shareCode, adminSecret };
}

export function loadState(shareCode) {
  const row = selectStmt.get(shareCode);
  if (!row) return undefined;
  return JSON.parse(row.state);
}

export function saveState(shareCode, state) {
  updateStmt.run(JSON.stringify(state), Date.now(), shareCode);
}

export function verifyAdmin(shareCode, secret) {
  if (!secret) return false;
  const row = selectStmt.get(shareCode);
  return !!row && row.admin_secret === secret;
}

export function gameExists(shareCode) {
  return !!selectStmt.get(shareCode);
}
