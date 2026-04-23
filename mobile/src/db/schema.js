export const schemaSql = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  pan TEXT,
  mobile TEXT,
  email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  budget_limit REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  fi_types TEXT NOT NULL,
  status TEXT NOT NULL,
  consent_handle TEXT NOT NULL,
  connector_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  consent_id TEXT,
  profile_id TEXT NOT NULL,
  fi_types TEXT NOT NULL,
  status TEXT NOT NULL,
  connector_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  session_id TEXT,
  source_type TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  sender TEXT,
  occurred_at TEXT,
  hash TEXT NOT NULL UNIQUE,
  raw_payload TEXT NOT NULL,
  parser_id TEXT,
  confidence REAL,
  parse_status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  session_id TEXT,
  fi_type TEXT NOT NULL,
  source_artifact_id TEXT,
  connector_key TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  account_key TEXT NOT NULL UNIQUE,
  fi_type TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_subtype TEXT,
  masked_identifier TEXT,
  current_balance REAL,
  credit_limit REAL,
  outstanding_amount REAL,
  currency TEXT DEFAULT 'INR',
  status TEXT,
  source_institution TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  account_id TEXT,
  session_id TEXT,
  financial_record_id TEXT,
  source_artifact_id TEXT,
  connector_key TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  txn_ref TEXT,
  txn_type TEXT NOT NULL,
  mode TEXT,
  amount REAL NOT NULL,
  running_balance REAL,
  txn_timestamp TEXT NOT NULL,
  value_date TEXT,
  narration TEXT,
  merchant_name TEXT,
  source_type TEXT NOT NULL,
  parser_id TEXT,
  confidence REAL,
  raw_payload TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_inferred_insights (
  profile_id TEXT PRIMARY KEY NOT NULL,
  inference_version INTEGER NOT NULL,
  insights TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parse_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  source_artifact_id TEXT NOT NULL UNIQUE,
  session_id TEXT,
  status TEXT NOT NULL,
  reason TEXT,
  suggested_payload TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  spent_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  target_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
