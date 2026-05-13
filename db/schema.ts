export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  greeting TEXT,
  gender TEXT,
  company_name TEXT,
  company_address TEXT,
  company_ice TEXT,
  account_iban TEXT,
  role TEXT,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  currency TEXT NOT NULL,
  pending_balance REAL NOT NULL DEFAULT 0,
  wallet_notes TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS sub_accounts (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  theme TEXT NOT NULL,
  is_main INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_profile ON sub_accounts(profile_id, position);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cardholder TEXT NOT NULL,
  network TEXT NOT NULL,
  masked_pan TEXT NOT NULL,
  expiry TEXT NOT NULL,
  limit_amount REAL NOT NULL DEFAULT 0,
  spent REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  position INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cards_profile ON cards(profile_id, position);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('credit','debit')),
  created_at TEXT NOT NULL,
  note TEXT,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transactions_profile ON transactions(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('paye','achat')),
  reference TEXT NOT NULL,
  client_name TEXT NOT NULL,
  invoice_object TEXT NOT NULL,
  amount_ht REAL NOT NULL,
  vat REAL NOT NULL,
  total_ttc REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','paid')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoices_profile ON invoices(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS employee_insurances (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  role TEXT,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('basic','premium','executive')),
  premium REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','pending','suspended')),
  start_date TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_insurances_profile ON employee_insurances(profile_id);
`;
