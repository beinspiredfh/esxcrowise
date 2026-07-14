CREATE TABLE IF NOT EXISTS message_logs (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL DEFAULT '',
  template_id TEXT NOT NULL DEFAULT '',
  recipient_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_message_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'prepared',
  body TEXT NOT NULL,
  error_message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS message_logs_escrow_id_idx ON message_logs (escrow_id);
