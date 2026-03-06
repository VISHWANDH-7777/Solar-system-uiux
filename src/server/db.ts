import Database from "better-sqlite3";

const db = new Database("legalorbit.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    theme_mode TEXT DEFAULT 'dark'
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    category TEXT,
    purpose TEXT,
    original_text TEXT,
    overall_risk_score INTEGER,
    complexity_score INTEGER,
    fairness_index INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clauses (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    clause_title TEXT,
    clause_text TEXT,
    simplified_text TEXT,
    importance_score INTEGER,
    risk_level TEXT,
    complexity_score INTEGER,
    financial_risk INTEGER,
    legal_risk INTEGER,
    operational_risk INTEGER,
    orbit_level TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );
`);

export default db;
