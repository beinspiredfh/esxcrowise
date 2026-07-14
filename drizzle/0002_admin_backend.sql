ALTER TABLE sellers ADD COLUMN bank_verification_status TEXT NOT NULL DEFAULT 'not_checked';
ALTER TABLE sellers ADD COLUMN verification_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE sellers ADD COLUMN admin_notes TEXT NOT NULL DEFAULT '';

ALTER TABLE escrows ADD COLUMN settlement_status TEXT NOT NULL DEFAULT 'not_due';
ALTER TABLE escrows ADD COLUMN admin_hold_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE escrows ADD COLUMN released_at TEXT NOT NULL DEFAULT '';
ALTER TABLE escrows ADD COLUMN refunded_at TEXT NOT NULL DEFAULT '';

ALTER TABLE disputes ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE disputes ADD COLUMN assigned_to TEXT NOT NULL DEFAULT '';
ALTER TABLE disputes ADD COLUMN admin_note TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY,
  fee_model TEXT NOT NULL DEFAULT 'percentage',
  fee_percent INTEGER NOT NULL DEFAULT 250,
  fixed_fee_kobo INTEGER NOT NULL DEFAULT 100000,
  fee_payer TEXT NOT NULL DEFAULT 'buyer',
  settlement_delay_hours INTEGER NOT NULL DEFAULT 24,
  auto_release_enabled INTEGER NOT NULL DEFAULT 0,
  support_phone TEXT NOT NULL DEFAULT '+234800ESXCROWISE',
  support_email TEXT NOT NULL DEFAULT 'support@esxcrowise.com',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO platform_settings (
  id, fee_model, fee_percent, fixed_fee_kobo, fee_payer, settlement_delay_hours,
  auto_release_enabled, support_phone, support_email
) VALUES (
  'default', 'percentage', 250, 100000, 'buyer', 24, 0,
  '+234800ESXCROWISE', 'support@esxcrowise.com'
);
