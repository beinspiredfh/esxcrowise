import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sellers = sqliteTable("sellers", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  bankName: text("bank_name").notNull().default(""),
  bankAccountName: text("bank_account_name").notNull().default(""),
  verificationStatus: text("verification_status").notNull().default("pending"),
  bankVerificationStatus: text("bank_verification_status").notNull().default("not_checked"),
  verificationNotes: text("verification_notes").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  trustScore: integer("trust_score").notNull().default(72),
  completedOrders: integer("completed_orders").notNull().default(0),
  disputeCount: integer("dispute_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const escrows = sqliteTable("escrows", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id").notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  itemAmountKobo: integer("item_amount_kobo").notNull().default(0),
  amountKobo: integer("amount_kobo").notNull(),
  feeKobo: integer("fee_kobo").notNull(),
  feeModel: text("fee_model").notNull().default("percentage"),
  feePercent: integer("fee_percent").notNull().default(250),
  fixedFeeKobo: integer("fixed_fee_kobo").notNull().default(0),
  feePayer: text("fee_payer").notNull().default("buyer"),
  sellerReceivesKobo: integer("seller_receives_kobo").notNull(),
  deliveryWindow: text("delivery_window").notNull(),
  status: text("status").notNull().default("draft"),
  riskLevel: text("risk_level").notNull().default("low"),
  settlementStatus: text("settlement_status").notNull().default("not_due"),
  adminHoldReason: text("admin_hold_reason").notNull().default(""),
  releasedAt: text("released_at").notNull().default(""),
  refundedAt: text("refunded_at").notNull().default(""),
  paymentReference: text("payment_reference").notNull().default(""),
  escrowLink: text("escrow_link").notNull(),
  whatsappMessage: text("whatsapp_message").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  escrowId: text("escrow_id").notNull(),
  openedBy: text("opened_by").notNull(),
  reason: text("reason").notNull(),
  evidenceNote: text("evidence_note").notNull().default(""),
  status: text("status").notNull().default("open"),
  resolution: text("resolution").notNull().default(""),
  priority: text("priority").notNull().default("normal"),
  assignedTo: text("assigned_to").notNull().default(""),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  escrowId: text("escrow_id").notNull(),
  actor: text("actor").notNull(),
  type: text("type").notNull(),
  note: text("note").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const platformSettings = sqliteTable("platform_settings", {
  id: text("id").primaryKey(),
  feeModel: text("fee_model").notNull().default("percentage"),
  feePercent: integer("fee_percent").notNull().default(250),
  fixedFeeKobo: integer("fixed_fee_kobo").notNull().default(100000),
  feePayer: text("fee_payer").notNull().default("buyer"),
  settlementDelayHours: integer("settlement_delay_hours").notNull().default(24),
  autoReleaseEnabled: integer("auto_release_enabled").notNull().default(0),
  supportPhone: text("support_phone").notNull().default("+234800ESXCROWISE"),
  supportEmail: text("support_email").notNull().default("support@esxcrowise.com"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sellerApplications = sqliteTable("seller_applications", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  socialHandle: text("social_handle").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankAccountName: text("bank_account_name").notNull().default(""),
  verificationIdType: text("verification_id_type").notNull().default(""),
  expectedMonthlyOrders: integer("expected_monthly_orders").notNull().default(0),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("new"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pilotSellers = sqliteTable("pilot_sellers", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  readinessStatus: text("readiness_status").notNull().default("candidate"),
  targetOrders: integer("target_orders").notNull().default(10),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("whatsapp"),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const messageLogs = sqliteTable("message_logs", {
  id: text("id").primaryKey(),
  escrowId: text("escrow_id").notNull().default(""),
  templateId: text("template_id").notNull().default(""),
  recipientPhone: text("recipient_phone").notNull(),
  channel: text("channel").notNull().default("whatsapp"),
  provider: text("provider").notNull().default("manual"),
  providerMessageId: text("provider_message_id").notNull().default(""),
  status: text("status").notNull().default("prepared"),
  body: text("body").notNull(),
  errorMessage: text("error_message").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const settlementEntries = sqliteTable("settlement_entries", {
  id: text("id").primaryKey(),
  escrowId: text("escrow_id").notNull(),
  accountType: text("account_type").notNull(),
  entryType: text("entry_type").notNull(),
  direction: text("direction").notNull(),
  amountKobo: integer("amount_kobo").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  postedAt: text("posted_at").notNull().default(""),
});
