CREATE TABLE IF NOT EXISTS seller_applications (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  social_handle TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  bank_account_name TEXT NOT NULL DEFAULT '',
  verification_id_type TEXT NOT NULL DEFAULT '',
  expected_monthly_orders INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pilot_sellers (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  readiness_status TEXT NOT NULL DEFAULT 'candidate',
  target_orders INTEGER NOT NULL DEFAULT 10,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS seller_applications_status_idx ON seller_applications (status);

INSERT OR IGNORE INTO message_templates (id, name, channel, body) VALUES
('TPL-PAYMENT-LINK', 'Payment link', 'whatsapp', 'Hi {{buyer_name}}, {{seller_name}} is using Esxcrowise to protect this order. Pay {{amount}} here: {{escrow_link}}. Your money is held until delivery is confirmed.'),
('TPL-PAYMENT-RECEIVED', 'Payment received', 'whatsapp', 'Esxcrowise has received payment for {{item_name}}. Seller can now proceed with delivery. Transaction ID: {{escrow_id}}.'),
('TPL-DELIVERY-PENDING', 'Delivery pending', 'whatsapp', 'Delivery is now pending for {{item_name}}. Buyer should inspect the item and confirm delivery on Esxcrowise when satisfied.'),
('TPL-DISPUTE-OPENED', 'Dispute opened', 'whatsapp', 'A dispute has been opened for {{escrow_id}}. Please send clear photos, delivery proof, and WhatsApp chat evidence to Esxcrowise support.'),
('TPL-RELEASE-REFUND', 'Release or refund', 'whatsapp', 'Esxcrowise has resolved {{escrow_id}}: {{resolution}}. Thank you for using protected trade.');

INSERT OR IGNORE INTO pilot_sellers (
  id, business_name, category, location, owner_phone, readiness_status, target_orders, notes
) VALUES
('PILOT-ADA', 'Ada Kicks', 'Fashion', 'Lagos', '+2348032218901', 'active', 20, 'Demo seller for first protected footwear trades.'),
('PILOT-GADGETS', 'Mainland Gadgets', 'Gadgets', 'Lagos', '+2348020001111', 'candidate', 10, 'High-risk category; require stronger evidence checks.'),
('PILOT-HAIR', 'Bisi Hair Hub', 'Hair and wigs', 'Abuja', '+2348050002222', 'candidate', 10, 'Good category for escrow due delivery disputes.'),
('PILOT-PERFUME', 'Scent Market NG', 'Perfume', 'Port Harcourt', '+2348060003333', 'candidate', 8, 'Lower-ticket repeat order pilot.'),
('PILOT-FURNITURE', 'Lekki Home Finds', 'Furniture', 'Lagos', '+2348070004444', 'candidate', 5, 'Delivery proof and inspection window needed.');
