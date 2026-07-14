CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT '',
  bank_account_name TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'pending',
  trust_score INTEGER NOT NULL DEFAULT 72,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS escrows (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  item_amount_kobo INTEGER NOT NULL DEFAULT 0,
  amount_kobo INTEGER NOT NULL,
  fee_kobo INTEGER NOT NULL,
  fee_model TEXT NOT NULL DEFAULT 'percentage',
  fee_percent INTEGER NOT NULL DEFAULT 250,
  fixed_fee_kobo INTEGER NOT NULL DEFAULT 0,
  fee_payer TEXT NOT NULL DEFAULT 'buyer',
  seller_receives_kobo INTEGER NOT NULL,
  delivery_window TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  risk_level TEXT NOT NULL DEFAULT 'low',
  payment_reference TEXT NOT NULL DEFAULT '',
  escrow_link TEXT NOT NULL,
  whatsapp_message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL,
  opened_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  type TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS escrows_seller_id_idx ON escrows (seller_id);
CREATE INDEX IF NOT EXISTS escrows_status_idx ON escrows (status);
CREATE INDEX IF NOT EXISTS disputes_escrow_id_idx ON disputes (escrow_id);
CREATE INDEX IF NOT EXISTS events_escrow_id_idx ON events (escrow_id);
