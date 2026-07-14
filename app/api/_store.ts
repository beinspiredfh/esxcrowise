import { env } from "cloudflare:workers";

type D1 = D1Database;

export type EscrowStatus =
  | "draft"
  | "payment_pending"
  | "paid"
  | "delivery_pending"
  | "delivered"
  | "disputed"
  | "released"
  | "refunded";

export type EscrowInput = {
  sellerId?: string;
  sellerBusinessName: string;
  sellerOwnerName: string;
  sellerPhone: string;
  sellerCategory: string;
  sellerLocation: string;
  buyerName: string;
  buyerPhone: string;
  itemName: string;
  category: string;
  amountNaira: number;
  feeModel?: "percentage" | "fixed";
  feePercent?: number;
  fixedFeeNaira?: number;
  feePayer?: "buyer" | "seller";
  deliveryWindow: string;
};

export type PlatformSettingsInput = {
  feeModel?: "percentage" | "fixed";
  feePercent?: number;
  fixedFeeNaira?: number;
  feePayer?: "buyer" | "seller";
  settlementDelayHours?: number;
  autoReleaseEnabled?: boolean;
  supportPhone?: string;
  supportEmail?: string;
};

export type SellerApplicationInput = {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  location: string;
  socialHandle: string;
  bankName: string;
  bankAccountName: string;
  verificationIdType: string;
  expectedMonthlyOrders: number;
  notes: string;
};

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    reference: string;
  };
};

type PaystackChargeSuccess = {
  event: string;
  data?: {
    status?: string;
    amount?: number;
    reference?: string;
  };
};

type WhatsAppSendResponse = {
  messaging_product?: string;
  contacts?: { input: string; wa_id: string }[];
  messages?: { id: string }[];
  error?: { message?: string };
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS sellers (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    bank_name TEXT NOT NULL DEFAULT '',
    bank_account_name TEXT NOT NULL DEFAULT '',
    verification_status TEXT NOT NULL DEFAULT 'pending',
    bank_verification_status TEXT NOT NULL DEFAULT 'not_checked',
    verification_notes TEXT NOT NULL DEFAULT '',
    admin_notes TEXT NOT NULL DEFAULT '',
    trust_score INTEGER NOT NULL DEFAULT 72,
    completed_orders INTEGER NOT NULL DEFAULT 0,
    dispute_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS escrows (
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
    settlement_status TEXT NOT NULL DEFAULT 'not_due',
    admin_hold_reason TEXT NOT NULL DEFAULT '',
    released_at TEXT NOT NULL DEFAULT '',
    refunded_at TEXT NOT NULL DEFAULT '',
    payment_reference TEXT NOT NULL DEFAULT '',
    escrow_link TEXT NOT NULL,
    whatsapp_message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL,
    opened_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence_note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    resolution TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to TEXT NOT NULL DEFAULT '',
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS platform_settings (
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
  )`,
  `CREATE TABLE IF NOT EXISTS seller_applications (
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
  )`,
  `CREATE TABLE IF NOT EXISTS pilot_sellers (
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
  )`,
  `CREATE TABLE IF NOT EXISTS message_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS message_logs (
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
  )`,
  `CREATE TABLE IF NOT EXISTS settlement_entries (
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
  )`,
  `CREATE INDEX IF NOT EXISTS escrows_seller_id_idx ON escrows (seller_id)`,
  `CREATE INDEX IF NOT EXISTS escrows_status_idx ON escrows (status)`,
  `CREATE INDEX IF NOT EXISTS disputes_escrow_id_idx ON disputes (escrow_id)`,
  `CREATE INDEX IF NOT EXISTS events_escrow_id_idx ON events (escrow_id)`,
  `CREATE INDEX IF NOT EXISTS seller_applications_status_idx ON seller_applications (status)`,
  `CREATE INDEX IF NOT EXISTS message_logs_escrow_id_idx ON message_logs (escrow_id)`,
  `CREATE INDEX IF NOT EXISTS settlement_entries_escrow_id_idx ON settlement_entries (escrow_id)`,
  `CREATE INDEX IF NOT EXISTS settlement_entries_status_idx ON settlement_entries (status)`,
];

const escrowColumnStatements = [
  ["item_amount_kobo", "ALTER TABLE escrows ADD COLUMN item_amount_kobo INTEGER NOT NULL DEFAULT 0"],
  ["fee_model", "ALTER TABLE escrows ADD COLUMN fee_model TEXT NOT NULL DEFAULT 'percentage'"],
  ["fee_percent", "ALTER TABLE escrows ADD COLUMN fee_percent INTEGER NOT NULL DEFAULT 250"],
  ["fixed_fee_kobo", "ALTER TABLE escrows ADD COLUMN fixed_fee_kobo INTEGER NOT NULL DEFAULT 0"],
  ["fee_payer", "ALTER TABLE escrows ADD COLUMN fee_payer TEXT NOT NULL DEFAULT 'buyer'"],
  ["settlement_status", "ALTER TABLE escrows ADD COLUMN settlement_status TEXT NOT NULL DEFAULT 'not_due'"],
  ["admin_hold_reason", "ALTER TABLE escrows ADD COLUMN admin_hold_reason TEXT NOT NULL DEFAULT ''"],
  ["released_at", "ALTER TABLE escrows ADD COLUMN released_at TEXT NOT NULL DEFAULT ''"],
  ["refunded_at", "ALTER TABLE escrows ADD COLUMN refunded_at TEXT NOT NULL DEFAULT ''"],
] as const;

const sellerColumnStatements = [
  ["bank_verification_status", "ALTER TABLE sellers ADD COLUMN bank_verification_status TEXT NOT NULL DEFAULT 'not_checked'"],
  ["verification_notes", "ALTER TABLE sellers ADD COLUMN verification_notes TEXT NOT NULL DEFAULT ''"],
  ["admin_notes", "ALTER TABLE sellers ADD COLUMN admin_notes TEXT NOT NULL DEFAULT ''"],
] as const;

const disputeColumnStatements = [
  ["priority", "ALTER TABLE disputes ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal'"],
  ["assigned_to", "ALTER TABLE disputes ADD COLUMN assigned_to TEXT NOT NULL DEFAULT ''"],
  ["admin_note", "ALTER TABLE disputes ADD COLUMN admin_note TEXT NOT NULL DEFAULT ''"],
] as const;

function getBinding(): D1 {
  if (!env.DB) {
    throw new Error("D1 binding DB is not available.");
  }

  return env.DB;
}

function id(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${random}`.toUpperCase();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function feeFor(
  itemAmountKobo: number,
  feeModel = "percentage",
  feePercent = 2.5,
  fixedFeeKobo = 100000
) {
  if (feeModel === "fixed") {
    return Math.max(0, fixedFeeKobo);
  }

  return Math.max(50000, Math.round(itemAmountKobo * (feePercent / 100)));
}

function pricingFor(input: {
  itemAmountKobo: number;
  feeModel?: string;
  feePercent?: number;
  fixedFeeNaira?: number;
  feePayer?: string;
}) {
  const feeModel = input.feeModel === "fixed" ? "fixed" : "percentage";
  const feePercent = Math.max(0, Number(input.feePercent || 2.5));
  const fixedFeeKobo = Math.max(0, Math.round(Number(input.fixedFeeNaira || 1000) * 100));
  const feePayer = input.feePayer === "seller" ? "seller" : "buyer";
  const feeKobo = feeFor(input.itemAmountKobo, feeModel, feePercent, fixedFeeKobo);
  const buyerPaysKobo =
    feePayer === "buyer" ? input.itemAmountKobo + feeKobo : input.itemAmountKobo;
  const sellerReceivesKobo =
    feePayer === "seller" ? input.itemAmountKobo - feeKobo : input.itemAmountKobo;

  return {
    feeModel,
    feePercentBasisPoints: Math.round(feePercent * 100),
    fixedFeeKobo,
    feePayer,
    feeKobo,
    buyerPaysKobo,
    sellerReceivesKobo: Math.max(0, sellerReceivesKobo),
  };
}

function riskFor(amountKobo: number, category: string) {
  if (amountKobo >= 30000000 || /phone|gadget|electronics/i.test(category)) {
    return "high";
  }

  if (amountKobo >= 12000000 || /wig|hair/i.test(category)) {
    return "medium";
  }

  return "low";
}

export async function initDb() {
  const db = getBinding();
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  await ensureColumns(db, "escrows", escrowColumnStatements);
  await ensureColumns(db, "sellers", sellerColumnStatements);
  await ensureColumns(db, "disputes", disputeColumnStatements);
  await seedDemoData(db);
}

async function ensureColumns(
  db: D1,
  tableName: string,
  statements: readonly (readonly [string, string])[]
) {
  const tableInfo = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  const existingColumns = new Set((tableInfo.results || []).map((column) => column.name));
  const missingColumns = statements
    .filter(([columnName]) => !existingColumns.has(columnName))
    .map(([, statement]) => db.prepare(statement));

  if (missingColumns.length > 0) {
    await db.batch(missingColumns);
  }
}

async function backfillEscrowAmounts(db: D1) {
  await db
    .prepare("UPDATE escrows SET item_amount_kobo = amount_kobo WHERE item_amount_kobo = 0")
    .run();
}

async function seedDemoData(db: D1) {
  const existing = await db
    .prepare("SELECT COUNT(*) as count FROM sellers")
    .first<{ count: number }>();

  if ((existing?.count ?? 0) > 0) {
    await seedLaunchData(db);
    return;
  }

  await db
    .prepare(
      `INSERT INTO sellers (
        id, business_name, owner_name, phone, category, location, bank_name,
        bank_account_name, verification_status, trust_score, completed_orders, dispute_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      "SELLER-ADA",
      "Ada Kicks",
      "Ada Nwosu",
      "+2348032218901",
      "Fashion",
      "Lagos",
      "Moniepoint",
      "ADA NWOSU",
      "verified",
      98,
      417,
      3
    )
    .run();

  const escrowId = "ESC-2407";
  const itemAmountKobo = 8650000;
  const pricing = pricingFor({
    itemAmountKobo,
    feeModel: "percentage",
    feePercent: 2.5,
    feePayer: "buyer",
  });
  const escrowLink = `${getPublicBaseUrl()}/pay/${escrowId.toLowerCase()}`;
  await db
    .prepare(
      `INSERT INTO escrows (
        id, seller_id, buyer_name, buyer_phone, item_name, category, item_amount_kobo,
        amount_kobo, fee_kobo, fee_model, fee_percent, fixed_fee_kobo, fee_payer,
        seller_receives_kobo, delivery_window, status, risk_level,
        payment_reference, escrow_link, whatsapp_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      escrowId,
      "SELLER-ADA",
      "Chinedu Okafor",
      "+2348032218901",
      "Nike Dunk Low, size 42",
      "Fashion",
      itemAmountKobo,
      pricing.buyerPaysKobo,
      pricing.feeKobo,
      pricing.feeModel,
      pricing.feePercentBasisPoints,
      pricing.fixedFeeKobo,
      pricing.feePayer,
      pricing.sellerReceivesKobo,
      "Today before 6 PM",
      "paid",
      "low",
      "DEMO-PAYSTACK-REF",
      escrowLink,
      `Hi Chinedu, please pay securely with Esxcrowise: ${escrowLink}`
    )
    .run();

  await addEvent(db, escrowId, "system", "seeded", "Demo escrow transaction created.");

  await db
    .prepare(
      `INSERT OR IGNORE INTO platform_settings (
        id, fee_model, fee_percent, fixed_fee_kobo, fee_payer, settlement_delay_hours,
        auto_release_enabled, support_phone, support_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      "default",
      "percentage",
      250,
      100000,
      "buyer",
      24,
      0,
      "+234800ESXCROWISE",
      "support@esxcrowise.com"
    )
    .run();

  await seedLaunchData(db);
}

async function seedLaunchData(db: D1) {
  const templates = [
    [
      "TPL-PAYMENT-LINK",
      "Payment link",
      "Hi {{buyer_name}}, {{seller_name}} is using Esxcrowise to protect this order. Pay {{amount}} here: {{escrow_link}}. Your money is held until delivery is confirmed.",
    ],
    [
      "TPL-PAYMENT-RECEIVED",
      "Payment received",
      "Esxcrowise has received payment for {{item_name}}. Seller can now proceed with delivery. Transaction ID: {{escrow_id}}.",
    ],
    [
      "TPL-DELIVERY-PENDING",
      "Delivery pending",
      "Delivery is now pending for {{item_name}}. Buyer should inspect the item and confirm delivery on Esxcrowise when satisfied.",
    ],
    [
      "TPL-DISPUTE-OPENED",
      "Dispute opened",
      "A dispute has been opened for {{escrow_id}}. Please send clear photos, delivery proof, and WhatsApp chat evidence to Esxcrowise support.",
    ],
    [
      "TPL-RELEASE-REFUND",
      "Release or refund",
      "Esxcrowise has resolved {{escrow_id}}: {{resolution}}. Thank you for using protected trade.",
    ],
  ];

  await db.batch(
    templates.map(([idValue, name, body]) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO message_templates (id, name, channel, body) VALUES (?, ?, ?, ?)"
        )
        .bind(idValue, name, "whatsapp", body)
    )
  );

  const pilotSellers = [
    ["PILOT-ADA", "Ada Kicks", "Fashion", "Lagos", "+2348032218901", "active", 20, "Demo seller for first protected footwear trades."],
    ["PILOT-GADGETS", "Mainland Gadgets", "Gadgets", "Lagos", "+2348020001111", "candidate", 10, "High-risk category; require stronger evidence checks."],
    ["PILOT-HAIR", "Bisi Hair Hub", "Hair and wigs", "Abuja", "+2348050002222", "candidate", 10, "Good category for escrow due delivery disputes."],
    ["PILOT-PERFUME", "Scent Market NG", "Perfume", "Port Harcourt", "+2348060003333", "candidate", 8, "Lower-ticket repeat order pilot."],
    ["PILOT-FURNITURE", "Lekki Home Finds", "Furniture", "Lagos", "+2348070004444", "candidate", 5, "Delivery proof and inspection window needed."],
  ];

  await db.batch(
    pilotSellers.map((seller) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO pilot_sellers (
            id, business_name, category, location, owner_phone, readiness_status,
            target_orders, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(...seller)
    )
  );
}

export async function getDashboard() {
  await initDb();
  const db = getBinding();
  await backfillEscrowAmounts(db);
  const sellers = await db
    .prepare("SELECT * FROM sellers ORDER BY created_at DESC LIMIT 12")
    .all();
  const escrows = await db
    .prepare(
      `SELECT escrows.*, sellers.business_name, sellers.trust_score
       FROM escrows
       LEFT JOIN sellers ON sellers.id = escrows.seller_id
       ORDER BY escrows.created_at DESC
       LIMIT 20`
    )
    .all();
  const disputes = await db
    .prepare(
      `SELECT disputes.*, escrows.item_name, escrows.amount_kobo, sellers.business_name
       FROM disputes
       LEFT JOIN escrows ON escrows.id = disputes.escrow_id
       LEFT JOIN sellers ON sellers.id = escrows.seller_id
       ORDER BY disputes.created_at DESC
       LIMIT 20`
    )
    .all();
  const events = await db
    .prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT 20")
    .all();
  const applications = await db
    .prepare("SELECT * FROM seller_applications ORDER BY created_at DESC LIMIT 20")
    .all();
  const pilotSellers = await db
    .prepare("SELECT * FROM pilot_sellers ORDER BY created_at DESC LIMIT 20")
    .all();
  const templates = await db
    .prepare("SELECT * FROM message_templates ORDER BY name ASC")
    .all();
  const messageLogs = await db
    .prepare("SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 15")
    .all();
  const settlementEntries = await db
    .prepare("SELECT * FROM settlement_entries ORDER BY created_at DESC LIMIT 25")
    .all();
  const settings = await getPlatformSettings();
  const summary = await getAdminSummary(db);

  return {
    sellers: sellers.results,
    escrows: escrows.results,
    disputes: disputes.results,
    events: events.results,
    applications: applications.results,
    pilotSellers: pilotSellers.results,
    templates: templates.results,
    messageLogs: messageLogs.results,
    settlementEntries: settlementEntries.results,
    opsChecklist: getOpsChecklist(),
    integrationReadiness: getIntegrationReadiness(),
    settings,
    summary,
  };
}

function getOpsChecklist() {
  return [
    {
      id: "legal-docs",
      title: "Publish policy pages",
      status: "ready",
      note: "Terms, privacy, refund, dispute, seller agreement, and buyer protection pages are available.",
    },
    {
      id: "seller-kyc",
      title: "Review seller applications",
      status: "ready",
      note: "Collect business, owner, bank, social handle, category, and expected order volume.",
    },
    {
      id: "pilot",
      title: "Start 5-10 seller pilot",
      status: "ready",
      note: "Use fashion, gadgets, wigs, perfume, and furniture sellers with manual WhatsApp links.",
    },
    {
      id: "support",
      title: "Assign dispute operator",
      status: "needs-owner",
      note: "One operator should review evidence, resolve disputes, and log decisions daily.",
    },
    {
      id: "domain",
      title: "Connect public domain",
      status: "pending",
      note: "Point the purchased Esxcrowise domain to the deployed web app, then set PUBLIC_BASE_URL.",
    },
  ];
}

function getIntegrationReadiness() {
  const paystackSecret = Boolean(getSecret("PAYSTACK_SECRET_KEY"));
  const paystackPublic = Boolean(getSecret("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"));
  const whatsappToken = Boolean(getSecret("WHATSAPP_ACCESS_TOKEN"));
  const whatsappPhoneNumberId = Boolean(getSecret("WHATSAPP_PHONE_NUMBER_ID"));
  const whatsappBusinessId = Boolean(getSecret("WHATSAPP_BUSINESS_ACCOUNT_ID"));
  const publicBaseUrl = getPublicBaseUrl();

  return {
    paystack: {
      status: paystackSecret ? "ready" : "waiting_for_keys",
      note: paystackSecret
        ? "Live Paystack checkout, callback, and webhook routes can run."
        : "Add PAYSTACK_SECRET_KEY after Paystack approval. Until then, checkout stays in mock mode.",
      requiredEnv: ["PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"],
      configuredCount: [paystackSecret, paystackPublic].filter(Boolean).length,
      webhookUrl: `${publicBaseUrl}/api/payments/paystack/webhook`,
      callbackUrl: `${publicBaseUrl}/api/payments/paystack/callback`,
    },
    whatsapp: {
      status: whatsappToken && whatsappPhoneNumberId ? "ready" : "waiting_for_meta",
      note:
        whatsappToken && whatsappPhoneNumberId
          ? "WhatsApp Cloud API sender is ready for live messages."
          : "Add Meta WhatsApp access token and phone number ID. Until then, the app prepares copyable messages.",
      requiredEnv: [
        "WHATSAPP_ACCESS_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_BUSINESS_ACCOUNT_ID",
      ],
      configuredCount: [whatsappToken, whatsappPhoneNumberId, whatsappBusinessId].filter(Boolean).length,
    },
    domain: {
      status: getSecret("PUBLIC_BASE_URL") ? "configured" : "select_domain",
      currentPublicBaseUrl: publicBaseUrl,
      candidates: ["esxcrowise.com", "esxcrowise.ng", "useesxcrowise.com"],
      nextAction: "Connect DNS to the hosting provider, then set PUBLIC_BASE_URL.",
    },
    pilot: {
      status: "ready_to_test",
      targetSellers: 5,
      targetOrdersPerSeller: 3,
      nextAction: "Create pilot test links for the first five sellers and send them through WhatsApp.",
    },
  };
}

async function getAdminSummary(db: D1) {
  const rows = await db
    .prepare(
      `SELECT
        SUM(CASE WHEN status IN ('paid', 'delivery_pending', 'delivered') THEN amount_kobo ELSE 0 END) as protected_volume_kobo,
        SUM(CASE WHEN status = 'delivered' THEN seller_receives_kobo ELSE 0 END) as pending_settlement_kobo,
        SUM(CASE WHEN status = 'released' THEN fee_kobo ELSE 0 END) as earned_commission_kobo,
        SUM(CASE WHEN status IN ('paid', 'delivery_pending', 'delivered') THEN fee_kobo ELSE 0 END) as pending_commission_kobo,
        SUM(CASE WHEN status = 'disputed' THEN amount_kobo ELSE 0 END) as disputed_value_kobo,
        SUM(CASE WHEN status = 'payment_pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as settlement_queue,
        SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as active_disputes
       FROM escrows`
    )
    .first<{
      protected_volume_kobo: number | null;
      pending_settlement_kobo: number | null;
      earned_commission_kobo: number | null;
      pending_commission_kobo: number | null;
      disputed_value_kobo: number | null;
      pending_payments: number | null;
      settlement_queue: number | null;
      active_disputes: number | null;
    }>();

  return {
    protectedVolumeKobo: rows?.protected_volume_kobo || 0,
    pendingSettlementKobo: rows?.pending_settlement_kobo || 0,
    earnedCommissionKobo: rows?.earned_commission_kobo || 0,
    pendingCommissionKobo: rows?.pending_commission_kobo || 0,
    disputedValueKobo: rows?.disputed_value_kobo || 0,
    pendingPayments: rows?.pending_payments || 0,
    settlementQueue: rows?.settlement_queue || 0,
    activeDisputes: rows?.active_disputes || 0,
  };
}

export async function createEscrow(input: EscrowInput) {
  await initDb();
  const db = getBinding();
  const settings = await getPlatformSettings();
  const sellerId = input.sellerId || `SELLER-${slug(input.sellerBusinessName) || id("SELLER")}`;
  const itemAmountKobo = Math.max(0, Math.round(Number(input.amountNaira) * 100));
  const pricing = pricingFor({
    itemAmountKobo,
    feeModel: input.feeModel || settings.fee_model,
    feePercent: input.feePercent ?? settings.fee_percent / 100,
    fixedFeeNaira: input.fixedFeeNaira ?? settings.fixed_fee_kobo / 100,
    feePayer: input.feePayer || settings.fee_payer,
  });
  const escrowId = id("ESC");
  const link = `${getPublicBaseUrl()}/pay/${escrowId.toLowerCase()}`;
  const risk = riskFor(pricing.buyerPaysKobo, input.category);
  const message = `Hi ${input.buyerName || "there"}, please pay ${formatNaira(
    pricing.buyerPaysKobo
  )} safely for ${input.itemName} using Esxcrowise. Commission: ${formatNaira(
    pricing.feeKobo
  )} paid by ${pricing.feePayer}. Your money is protected until delivery is confirmed. ${link}`;

  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO sellers (
          id, business_name, owner_name, phone, category, location, verification_status,
          trust_score, completed_orders, dispute_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        sellerId,
        input.sellerBusinessName,
        input.sellerOwnerName,
        input.sellerPhone,
        input.sellerCategory,
        input.sellerLocation,
        "pending",
        72,
        0,
        0
      ),
    db
      .prepare(
        `INSERT INTO escrows (
          id, seller_id, buyer_name, buyer_phone, item_name, category, item_amount_kobo,
          amount_kobo, fee_kobo, fee_model, fee_percent, fixed_fee_kobo, fee_payer,
          seller_receives_kobo, delivery_window, status, risk_level,
          escrow_link, whatsapp_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        escrowId,
        sellerId,
        input.buyerName,
        input.buyerPhone,
        input.itemName,
        input.category,
        itemAmountKobo,
        pricing.buyerPaysKobo,
        pricing.feeKobo,
        pricing.feeModel,
        pricing.feePercentBasisPoints,
        pricing.fixedFeeKobo,
        pricing.feePayer,
        pricing.sellerReceivesKobo,
        input.deliveryWindow,
        "payment_pending",
        risk,
        link,
        message
      ),
  ]);

  await addEvent(db, escrowId, "seller", "escrow_created", "Seller created a protected payment link.");
  return getEscrow(escrowId);
}

export async function initializePayment(
  escrowId: string,
  buyerEmail: string,
  origin: string
) {
  await initDb();
  const db = getBinding();
  const escrow = await db
    .prepare("SELECT * FROM escrows WHERE id = ?")
    .bind(escrowId)
    .first<{
      id: string;
      amount_kobo: number;
      buyer_name: string;
      item_name: string;
      payment_reference: string;
    }>();

  if (!escrow) {
    throw new Error("Escrow not found.");
  }

  const reference = escrow.payment_reference || `${escrow.id}-${Date.now()}`;
  const secretKey = getSecret("PAYSTACK_SECRET_KEY");

  if (!secretKey) {
    await db
      .prepare(
        "UPDATE escrows SET payment_reference = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(reference, "payment_pending", escrow.id)
      .run();
    await addEvent(
      db,
      escrow.id,
      "system",
      "payment_initialized",
      "Mock payment initialized. Add PAYSTACK_SECRET_KEY to use live Paystack checkout."
    );

    return {
      provider: "mock",
      authorizationUrl: `${origin}/?mock_payment_reference=${encodeURIComponent(reference)}`,
      accessCode: "mock_access_code",
      reference,
    };
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: buyerEmail,
      amount: escrow.amount_kobo,
      reference,
      callback_url: `${origin}/api/payments/paystack/callback?reference=${encodeURIComponent(reference)}`,
      metadata: {
        escrow_id: escrow.id,
        buyer_name: escrow.buyer_name,
        item_name: escrow.item_name,
      },
    }),
  });

  const result = (await response.json()) as PaystackInitializeResponse;
  if (!response.ok || !result.status || !result.data) {
    throw new Error(result.message || "Paystack initialization failed.");
  }

  await db
    .prepare(
      "UPDATE escrows SET payment_reference = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(result.data.reference, "payment_pending", escrow.id)
    .run();
  await addEvent(db, escrow.id, "paystack", "payment_initialized", "Paystack checkout initialized.");

  return {
    provider: "paystack",
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference: result.data.reference,
  };
}

export async function verifyPaystackPayment(reference: string) {
  await initDb();
  const secretKey = getSecret("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );
  const result = (await response.json()) as PaystackVerifyResponse;
  if (!response.ok || !result.status || !result.data) {
    throw new Error(result.message || "Paystack verification failed.");
  }

  return markPaidFromProvider(
    result.data.reference,
    result.data.amount,
    result.data.status,
    "paystack_verify"
  );
}

export async function processPaystackWebhook(rawBody: string, signature: string | null) {
  const secretKey = getSecret("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const expectedSignature = await hmacSha512(rawBody, secretKey);
  if (!signature || !timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Invalid Paystack webhook signature.");
  }

  const payload = JSON.parse(rawBody) as PaystackChargeSuccess;
  if (payload.event !== "charge.success") {
    return { ignored: true, event: payload.event };
  }

  return markPaidFromProvider(
    payload.data?.reference || "",
    payload.data?.amount || 0,
    payload.data?.status || "",
    "paystack_webhook"
  );
}

export async function sendWhatsAppMessage(input: {
  escrowId?: string;
  templateId?: string;
  recipientPhone: string;
  body?: string;
}) {
  await initDb();
  const db = getBinding();
  const recipientPhone = normalizePhone(input.recipientPhone);
  if (!recipientPhone) {
    throw new Error("Recipient phone is required.");
  }

  const template = input.templateId
    ? await db
        .prepare("SELECT * FROM message_templates WHERE id = ?")
        .bind(input.templateId)
        .first<{ id: string; body: string }>()
    : null;
  const escrow = input.escrowId
    ? await db
        .prepare(
          `SELECT escrows.*, sellers.business_name
           FROM escrows
           LEFT JOIN sellers ON sellers.id = escrows.seller_id
           WHERE escrows.id = ?`
        )
        .bind(input.escrowId)
        .first<{
          id: string;
          buyer_name: string;
          item_name: string;
          amount_kobo: number;
          escrow_link: string;
          business_name: string;
        }>()
    : null;

  const body = renderTemplate(input.body || template?.body || "", {
    buyer_name: escrow?.buyer_name || "there",
    seller_name: escrow?.business_name || "the seller",
    item_name: escrow?.item_name || "your order",
    amount: escrow ? formatNaira(escrow.amount_kobo) : "",
    escrow_id: escrow?.id || input.escrowId || "",
    escrow_link: escrow?.escrow_link || "",
    resolution: "pending review",
  }).trim();

  if (!body) {
    throw new Error("Message body is required.");
  }

  const accessToken = getSecret("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getSecret("WHATSAPP_PHONE_NUMBER_ID");
  const graphVersion = getSecret("WHATSAPP_GRAPH_VERSION") || "v23.0";

  if (!accessToken || !phoneNumberId) {
    const logId = await logMessage(db, {
      escrowId: input.escrowId || "",
      templateId: input.templateId || "",
      recipientPhone,
      provider: "manual",
      status: "prepared",
      body,
      providerMessageId: "",
      errorMessage: "WhatsApp credentials are not configured.",
    });

    if (input.escrowId) {
      await addEvent(db, input.escrowId, "system", "whatsapp_message_prepared", body);
    }

    return {
      provider: "manual",
      status: "prepared",
      messageId: logId,
      body,
      note: "WhatsApp credentials are not configured yet. Copy this message into WhatsApp for the pilot.",
      ...(await getDashboard()),
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: {
          preview_url: true,
          body,
        },
      }),
    }
  );
  const result = (await response.json()) as WhatsAppSendResponse;
  if (!response.ok || result.error) {
    const errorMessage = result.error?.message || "WhatsApp send failed.";
    await logMessage(db, {
      escrowId: input.escrowId || "",
      templateId: input.templateId || "",
      recipientPhone,
      provider: "whatsapp_cloud",
      status: "failed",
      body,
      providerMessageId: "",
      errorMessage,
    });
    throw new Error(errorMessage);
  }

  const providerMessageId = result.messages?.[0]?.id || "";
  await logMessage(db, {
    escrowId: input.escrowId || "",
    templateId: input.templateId || "",
    recipientPhone,
    provider: "whatsapp_cloud",
    status: "sent",
    body,
    providerMessageId,
    errorMessage: "",
  });
  if (input.escrowId) {
    await addEvent(db, input.escrowId, "whatsapp", "whatsapp_message_sent", providerMessageId || body);
  }

  return {
    provider: "whatsapp_cloud",
    status: "sent",
    providerMessageId,
    body,
    ...(await getDashboard()),
  };
}

async function logMessage(
  db: D1,
  input: {
    escrowId: string;
    templateId: string;
    recipientPhone: string;
    provider: string;
    status: string;
    body: string;
    providerMessageId: string;
    errorMessage: string;
  }
) {
  const logId = id("MSG");
  await db
    .prepare(
      `INSERT INTO message_logs (
        id, escrow_id, template_id, recipient_phone, channel, provider,
        provider_message_id, status, body, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      logId,
      input.escrowId,
      input.templateId,
      input.recipientPhone,
      "whatsapp",
      input.provider,
      input.providerMessageId,
      input.status,
      input.body,
      input.errorMessage
    )
    .run();
  return logId;
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-z_]+)\s*}}/g, (_, key: string) => values[key] || "");
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export async function getEscrow(escrowId: string) {
  await initDb();
  const db = getBinding();
  const escrow = await db
    .prepare(
      `SELECT escrows.*, sellers.business_name, sellers.owner_name, sellers.phone as seller_phone,
        sellers.verification_status, sellers.trust_score, sellers.completed_orders, sellers.dispute_count
       FROM escrows
       LEFT JOIN sellers ON sellers.id = escrows.seller_id
       WHERE escrows.id = ?`
    )
    .bind(escrowId)
    .first();
  const events = await db
    .prepare("SELECT * FROM events WHERE escrow_id = ? ORDER BY created_at DESC")
    .bind(escrowId)
    .all();

  return { escrow, events: events.results };
}

export async function updateEscrowStatus(
  escrowId: string,
  status: EscrowStatus,
  actor: string,
  note: string
) {
  await initDb();
  const db = getBinding();
  const releasedAt = status === "released" ? ", released_at = CURRENT_TIMESTAMP, settlement_status = 'settled'" : "";
  const refundedAt = status === "refunded" ? ", refunded_at = CURRENT_TIMESTAMP, settlement_status = 'refunded'" : "";
  await db
    .prepare(
      `UPDATE escrows SET status = ?, updated_at = CURRENT_TIMESTAMP${releasedAt}${refundedAt} WHERE id = ?`
    )
    .bind(status, escrowId)
    .run();
  await recordSettlementEntriesForStatus(db, escrowId, status, note);
  await addEvent(db, escrowId, actor, status, note);
  return getEscrow(escrowId);
}

async function markPaidFromProvider(
  reference: string,
  providerAmountKobo: number,
  providerStatus: string,
  eventType: string
) {
  await initDb();
  const db = getBinding();
  const escrow = await db
    .prepare("SELECT * FROM escrows WHERE payment_reference = ?")
    .bind(reference)
    .first<{ id: string; amount_kobo: number }>();

  if (!escrow) {
    throw new Error("No escrow matched this payment reference.");
  }

  if (providerStatus !== "success") {
    await addEvent(db, escrow.id, "paystack", "payment_not_successful", providerStatus);
    return { paid: false, reason: providerStatus, escrowId: escrow.id };
  }

  if (providerAmountKobo !== escrow.amount_kobo) {
    await addEvent(
      db,
      escrow.id,
      "paystack",
      "payment_amount_mismatch",
      `Expected ${escrow.amount_kobo}, got ${providerAmountKobo}.`
    );
    throw new Error("Payment amount mismatch.");
  }

  await db
    .prepare("UPDATE escrows SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind("paid", escrow.id)
    .run();
  await recordSettlementEntriesForStatus(
    db,
    escrow.id,
    "paid",
    "Esxcrowise received full buyer payment. Seller payout is held until delivery is confirmed."
  );
  await addEvent(db, escrow.id, "paystack", eventType, "Payment verified and escrow marked as paid.");
  return { paid: true, escrowId: escrow.id };
}

export async function openDispute(escrowId: string, reason: string, evidenceNote: string) {
  await initDb();
  const db = getBinding();
  const disputeId = id("DSP");
  await db.batch([
    db
      .prepare(
        `INSERT INTO disputes (id, escrow_id, opened_by, reason, evidence_note, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(disputeId, escrowId, "buyer", reason, evidenceNote, "open"),
    db
      .prepare("UPDATE escrows SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind("disputed", escrowId),
  ]);
  await addEvent(db, escrowId, "buyer", "dispute_opened", reason);
  return { disputeId, ...(await getDashboard()) };
}

export async function resolveDispute(disputeId: string, resolution: string, adminNote = "") {
  await initDb();
  const db = getBinding();
  const dispute = await db
    .prepare("SELECT * FROM disputes WHERE id = ?")
    .bind(disputeId)
    .first<{ escrow_id: string }>();

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  const nextStatus = resolution === "refund_buyer" ? "refunded" : "released";
  const settlementStatus = resolution === "refund_buyer" ? "refunded" : "settled";
  const timestampColumn = resolution === "refund_buyer" ? "refunded_at" : "released_at";
  await db.batch([
    db
      .prepare(
        "UPDATE disputes SET status = ?, resolution = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind("resolved", resolution, adminNote, disputeId),
    db
      .prepare(
        `UPDATE escrows SET status = ?, settlement_status = ?, ${timestampColumn} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(nextStatus, settlementStatus, dispute.escrow_id),
  ]);
  await recordSettlementEntriesForStatus(db, dispute.escrow_id, nextStatus, adminNote);
  await addEvent(db, dispute.escrow_id, "admin", "dispute_resolved", `${resolution}. ${adminNote}`);
  return getDashboard();
}

export async function updateSellerVerification(
  sellerId: string,
  input: {
    verificationStatus?: string;
    bankVerificationStatus?: string;
    trustScore?: number;
    verificationNotes?: string;
    adminNotes?: string;
  }
) {
  await initDb();
  const db = getBinding();
  const current = await db
    .prepare("SELECT * FROM sellers WHERE id = ?")
    .bind(sellerId)
    .first<{
      verification_status: string;
      bank_verification_status: string;
      trust_score: number;
      verification_notes: string;
      admin_notes: string;
    }>();

  if (!current) {
    throw new Error("Seller not found.");
  }

  const nextVerificationStatus = input.verificationStatus || current.verification_status;
  const nextBankStatus = input.bankVerificationStatus || current.bank_verification_status;
  const nextTrustScore = Math.max(0, Math.min(100, Number(input.trustScore ?? current.trust_score)));
  const nextVerificationNotes = input.verificationNotes ?? current.verification_notes;
  const nextAdminNotes = input.adminNotes ?? current.admin_notes;

  await db
    .prepare(
      `UPDATE sellers
       SET verification_status = ?, bank_verification_status = ?, trust_score = ?,
        verification_notes = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      nextVerificationStatus,
      nextBankStatus,
      nextTrustScore,
      nextVerificationNotes,
      nextAdminNotes,
      sellerId
    )
    .run();

  const escrows = await db
    .prepare("SELECT id FROM escrows WHERE seller_id = ? ORDER BY created_at DESC LIMIT 5")
    .bind(sellerId)
    .all<{ id: string }>();
  await Promise.all(
    (escrows.results || []).map((escrow) =>
      addEvent(
        db,
        escrow.id,
        "admin",
        "seller_verification_updated",
        `${nextVerificationStatus}; bank ${nextBankStatus}; score ${nextTrustScore}. ${nextVerificationNotes}`
      )
    )
  );

  return getDashboard();
}

export async function adminEscrowAction(
  escrowId: string,
  action: "hold" | "release" | "refund" | "mark_delivery_pending" | "clear_hold",
  note = ""
) {
  await initDb();
  const db = getBinding();
  const escrow = await db
    .prepare("SELECT * FROM escrows WHERE id = ?")
    .bind(escrowId)
    .first<{ id: string }>();

  if (!escrow) {
    throw new Error("Escrow not found.");
  }

  const actionMap = {
    hold: {
      status: "disputed",
      settlementStatus: "on_hold",
      holdReason: note || "Admin hold for review.",
      event: "admin_hold",
    },
    release: {
      status: "released",
      settlementStatus: "settled",
      holdReason: "",
      event: "admin_release",
    },
    refund: {
      status: "refunded",
      settlementStatus: "refunded",
      holdReason: "",
      event: "admin_refund",
    },
    mark_delivery_pending: {
      status: "delivery_pending",
      settlementStatus: "not_due",
      holdReason: "",
      event: "delivery_pending",
    },
    clear_hold: {
      status: "paid",
      settlementStatus: "not_due",
      holdReason: "",
      event: "admin_hold_cleared",
    },
  }[action];

  const releasedAt = action === "release" ? ", released_at = CURRENT_TIMESTAMP" : "";
  const refundedAt = action === "refund" ? ", refunded_at = CURRENT_TIMESTAMP" : "";
  await db
    .prepare(
      `UPDATE escrows
       SET status = ?, settlement_status = ?, admin_hold_reason = ?, updated_at = CURRENT_TIMESTAMP${releasedAt}${refundedAt}
       WHERE id = ?`
    )
    .bind(actionMap.status, actionMap.settlementStatus, actionMap.holdReason, escrowId)
    .run();
  await recordSettlementEntriesForStatus(
    db,
    escrowId,
    actionMap.status as EscrowStatus,
    note || actionMap.event
  );
  await addEvent(db, escrowId, "admin", actionMap.event, note || actionMap.event);
  return getDashboard();
}

export async function updateDisputeAdmin(
  disputeId: string,
  input: { priority?: string; assignedTo?: string; adminNote?: string }
) {
  await initDb();
  const db = getBinding();
  const dispute = await db
    .prepare("SELECT * FROM disputes WHERE id = ?")
    .bind(disputeId)
    .first<{
      escrow_id: string;
      priority: string;
      assigned_to: string;
      admin_note: string;
    }>();

  if (!dispute) {
    throw new Error("Dispute not found.");
  }

  const priority = input.priority || dispute.priority;
  const assignedTo = input.assignedTo ?? dispute.assigned_to;
  const adminNote = input.adminNote ?? dispute.admin_note;
  await db
    .prepare(
      `UPDATE disputes
       SET priority = ?, assigned_to = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(priority, assignedTo, adminNote, disputeId)
    .run();
  await addEvent(db, dispute.escrow_id, "admin", "dispute_admin_updated", `${priority}; ${assignedTo}; ${adminNote}`);
  return getDashboard();
}

async function recordSettlementEntriesForStatus(
  db: D1,
  escrowId: string,
  status: string,
  note = ""
) {
  const escrow = await db
    .prepare(
      `SELECT id, amount_kobo, fee_kobo, seller_receives_kobo
       FROM escrows
       WHERE id = ?`
    )
    .bind(escrowId)
    .first<{
      id: string;
      amount_kobo: number;
      fee_kobo: number;
      seller_receives_kobo: number;
    }>();

  if (!escrow) {
    return;
  }

  if (status === "paid") {
    await createSettlementEntry(db, {
      escrowId,
      accountType: "esxcrowise_hold",
      entryType: "buyer_payment_received",
      direction: "credit",
      amountKobo: escrow.amount_kobo,
      status: "posted",
      note: note || "Esxcrowise received full payment from buyer and is holding funds.",
      posted: true,
    });
    await createSettlementEntry(db, {
      escrowId,
      accountType: "esxcrowise_commission",
      entryType: "commission_reserved",
      direction: "credit",
      amountKobo: escrow.fee_kobo,
      status: "pending",
      note: "Esxcrowise commission reserved. It becomes earned when seller payout is released.",
    });
    return;
  }

  if (status === "delivered") {
    await db
      .prepare(
        "UPDATE escrows SET settlement_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND settlement_status = ?"
      )
      .bind("payable", escrowId, "not_due")
      .run();
    await createSettlementEntry(db, {
      escrowId,
      accountType: "seller_payout",
      entryType: "seller_payout_due",
      direction: "debit",
      amountKobo: escrow.seller_receives_kobo,
      status: "pending",
      note: note || "Delivery confirmed. Seller payout is now ready for admin release.",
    });
    return;
  }

  if (status === "released") {
    await createSettlementEntry(db, {
      escrowId,
      accountType: "seller_payout",
      entryType: "seller_payout_released",
      direction: "debit",
      amountKobo: escrow.seller_receives_kobo,
      status: "posted",
      note: note || "Seller payout released after delivery confirmation.",
      posted: true,
    });
    await createSettlementEntry(db, {
      escrowId,
      accountType: "esxcrowise_commission",
      entryType: "commission_earned",
      direction: "credit",
      amountKobo: escrow.fee_kobo,
      status: "posted",
      note: "Esxcrowise commission retained after successful release.",
      posted: true,
    });
    return;
  }

  if (status === "refunded") {
    await createSettlementEntry(db, {
      escrowId,
      accountType: "buyer_refund",
      entryType: "buyer_refund_posted",
      direction: "debit",
      amountKobo: escrow.amount_kobo,
      status: "posted",
      note: note || "Buyer refund recorded. Seller payout is not released.",
      posted: true,
    });
  }
}

async function createSettlementEntry(
  db: D1,
  input: {
    escrowId: string;
    accountType: string;
    entryType: string;
    direction: "credit" | "debit";
    amountKobo: number;
    status: string;
    note: string;
    posted?: boolean;
  }
) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO settlement_entries (
        id, escrow_id, account_type, entry_type, direction, amount_kobo,
        status, note, posted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id("SET"),
      input.escrowId,
      input.accountType,
      input.entryType,
      input.direction,
      Math.max(0, Math.round(input.amountKobo)),
      input.status,
      input.note,
      input.posted ? new Date().toISOString() : ""
    )
    .run();
}

export async function getPlatformSettings() {
  const db = getBinding();
  const existing = await db
    .prepare("SELECT * FROM platform_settings WHERE id = ?")
    .bind("default")
    .first<{
      fee_model: string;
      fee_percent: number;
      fixed_fee_kobo: number;
      fee_payer: string;
      settlement_delay_hours: number;
      auto_release_enabled: number;
      support_phone: string;
      support_email: string;
    }>();

  if (existing) {
    return existing;
  }

  await db
    .prepare(
      `INSERT INTO platform_settings (
        id, fee_model, fee_percent, fixed_fee_kobo, fee_payer, settlement_delay_hours,
        auto_release_enabled, support_phone, support_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind("default", "percentage", 250, 100000, "buyer", 24, 0, "+234800ESXCROWISE", "support@esxcrowise.com")
    .run();

  return getPlatformSettings();
}

export async function updatePlatformSettings(input: PlatformSettingsInput) {
  await initDb();
  const db = getBinding();
  const current = await getPlatformSettings();
  const feeModel = input.feeModel === "fixed" ? "fixed" : input.feeModel === "percentage" ? "percentage" : current.fee_model;
  const feePercent = Math.max(0, Math.round(Number(input.feePercent ?? current.fee_percent / 100) * 100));
  const fixedFeeKobo = Math.max(0, Math.round(Number(input.fixedFeeNaira ?? current.fixed_fee_kobo / 100) * 100));
  const feePayer = input.feePayer === "seller" ? "seller" : input.feePayer === "buyer" ? "buyer" : current.fee_payer;
  const settlementDelayHours = Math.max(0, Math.round(Number(input.settlementDelayHours ?? current.settlement_delay_hours)));
  const autoReleaseEnabled =
    typeof input.autoReleaseEnabled === "boolean"
      ? input.autoReleaseEnabled
        ? 1
        : 0
      : current.auto_release_enabled;

  await db
    .prepare(
      `UPDATE platform_settings
       SET fee_model = ?, fee_percent = ?, fixed_fee_kobo = ?, fee_payer = ?,
        settlement_delay_hours = ?, auto_release_enabled = ?, support_phone = ?,
        support_email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      feeModel,
      feePercent,
      fixedFeeKobo,
      feePayer,
      settlementDelayHours,
      autoReleaseEnabled,
      input.supportPhone ?? current.support_phone,
      input.supportEmail ?? current.support_email,
      "default"
    )
    .run();

  return getDashboard();
}

export async function createSellerApplication(input: SellerApplicationInput) {
  await initDb();
  const db = getBinding();
  const applicationId = id("APP");
  await db
    .prepare(
      `INSERT INTO seller_applications (
        id, business_name, owner_name, phone, email, category, location,
        social_handle, bank_name, bank_account_name, verification_id_type,
        expected_monthly_orders, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      applicationId,
      input.businessName,
      input.ownerName,
      input.phone,
      input.email,
      input.category,
      input.location,
      input.socialHandle,
      input.bankName,
      input.bankAccountName,
      input.verificationIdType,
      Math.max(0, Math.round(Number(input.expectedMonthlyOrders) || 0)),
      input.notes,
      "new"
    )
    .run();

  return { applicationId, status: "new" };
}

export async function updateSellerApplication(
  applicationId: string,
  input: { status?: string; adminNote?: string; promoteToPilot?: boolean }
) {
  await initDb();
  const db = getBinding();
  const application = await db
    .prepare("SELECT * FROM seller_applications WHERE id = ?")
    .bind(applicationId)
    .first<{
      business_name: string;
      category: string;
      location: string;
      phone: string;
      expected_monthly_orders: number;
      notes: string;
      status: string;
      admin_note: string;
    }>();

  if (!application) {
    throw new Error("Seller application not found.");
  }

  const status = input.status || application.status;
  const adminNote = input.adminNote ?? application.admin_note;
  await db
    .prepare(
      "UPDATE seller_applications SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(status, adminNote, applicationId)
    .run();

  if (input.promoteToPilot) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO pilot_sellers (
          id, business_name, category, location, owner_phone, readiness_status,
          target_orders, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        `PILOT-${slug(application.business_name) || applicationId}`,
        application.business_name,
        application.category,
        application.location,
        application.phone,
        "candidate",
        Math.max(5, application.expected_monthly_orders || 5),
        adminNote || application.notes
      )
      .run();
  }

  return getDashboard();
}

export async function createPilotTestLinks() {
  await initDb();
  const db = getBinding();
  const pilotSellers = await db
    .prepare("SELECT * FROM pilot_sellers ORDER BY readiness_status = 'active' DESC, created_at ASC LIMIT 5")
    .all<{
      id: string;
      business_name: string;
      category: string;
      location: string;
      owner_phone: string;
      readiness_status: string;
      target_orders: number;
      notes: string;
    }>();

  const created: string[] = [];
  for (const seller of pilotSellers.results || []) {
    const sellerId = `SELLER-${slug(seller.business_name) || seller.id}`;
    const existing = await db
      .prepare("SELECT id FROM escrows WHERE seller_id = ? AND payment_reference LIKE 'PILOT-%' LIMIT 1")
      .bind(sellerId)
      .first<{ id: string }>();

    if (existing) {
      continue;
    }

    const itemAmountKobo = pilotAmountFor(seller.category);
    const pricing = pricingFor({
      itemAmountKobo,
      feeModel: "percentage",
      feePercent: 2.5,
      feePayer: "buyer",
    });
    const escrowId = id("ESC");
    const link = `${getPublicBaseUrl()}/pay/${escrowId.toLowerCase()}`;
    const itemName = pilotItemFor(seller.category);

    await db.batch([
      db
        .prepare(
          `INSERT OR IGNORE INTO sellers (
            id, business_name, owner_name, phone, category, location,
            verification_status, trust_score, completed_orders, dispute_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          sellerId,
          seller.business_name,
          `${seller.business_name} owner`,
          seller.owner_phone,
          seller.category,
          seller.location,
          seller.readiness_status === "active" ? "verified" : "pending",
          seller.readiness_status === "active" ? 88 : 72,
          0,
          0
        ),
      db
        .prepare(
          `INSERT INTO escrows (
            id, seller_id, buyer_name, buyer_phone, item_name, category,
            item_amount_kobo, amount_kobo, fee_kobo, fee_model, fee_percent,
            fixed_fee_kobo, fee_payer, seller_receives_kobo, delivery_window,
            status, risk_level, payment_reference, escrow_link, whatsapp_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          escrowId,
          sellerId,
          "Pilot Buyer",
          seller.owner_phone,
          itemName,
          seller.category,
          itemAmountKobo,
          pricing.buyerPaysKobo,
          pricing.feeKobo,
          pricing.feeModel,
          pricing.feePercentBasisPoints,
          pricing.fixedFeeKobo,
          pricing.feePayer,
          pricing.sellerReceivesKobo,
          "Pilot delivery within 48 hours",
          "payment_pending",
          riskFor(pricing.buyerPaysKobo, seller.category),
          `PILOT-${escrowId}`,
          link,
          `Hi Pilot Buyer, ${seller.business_name} is using Esxcrowise. Pay ${formatNaira(pricing.buyerPaysKobo)} here: ${link}`
        ),
    ]);
    await addEvent(db, escrowId, "admin", "pilot_test_link_created", `Pilot link created for ${seller.business_name}.`);
    created.push(escrowId);
  }

  return {
    createdCount: created.length,
    createdEscrowIds: created,
    ...(await getDashboard()),
  };
}

function pilotAmountFor(category: string) {
  if (/gadget/i.test(category)) return 18000000;
  if (/furniture/i.test(category)) return 25000000;
  if (/hair|wig/i.test(category)) return 9500000;
  if (/perfume/i.test(category)) return 4200000;
  return 6500000;
}

function pilotItemFor(category: string) {
  if (/gadget/i.test(category)) return "Pilot smartphone order";
  if (/furniture/i.test(category)) return "Pilot home furniture order";
  if (/hair|wig/i.test(category)) return "Pilot wig order";
  if (/perfume/i.test(category)) return "Pilot perfume order";
  return "Pilot fashion order";
}

async function addEvent(db: D1, escrowId: string, actor: string, type: string, note: string) {
  await db
    .prepare("INSERT INTO events (id, escrow_id, actor, type, note) VALUES (?, ?, ?, ?, ?)")
    .bind(id("EVT"), escrowId, actor, type, note)
    .run();
}

function getSecret(name: string) {
  const value = (env as unknown as Record<string, string | undefined>)[name];
  return typeof value === "string" && value.length > 0 ? value : "";
}

function getPublicBaseUrl() {
  return getSecret("PUBLIC_BASE_URL") || "https://esxcrowise.com";
}

async function hmacSha512(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}
