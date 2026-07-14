CREATE TABLE IF NOT EXISTS settlement_entries (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL,
  account_type TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount_kobo INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  posted_at TEXT NOT NULL DEFAULT '',
  UNIQUE (escrow_id, entry_type)
);

CREATE INDEX IF NOT EXISTS settlement_entries_escrow_id_idx ON settlement_entries (escrow_id);
CREATE INDEX IF NOT EXISTS settlement_entries_status_idx ON settlement_entries (status);
