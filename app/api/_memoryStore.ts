import type {
  EscrowInput,
  EscrowStatus,
  PlatformSettingsInput,
  SellerApplicationInput,
} from "./_store";

type Row = Record<string, any>;

const now = () => new Date().toISOString();

const state = {
  settings: {
    id: "default",
    fee_model: "percentage",
    fee_percent: 250,
    fixed_fee_kobo: 100000,
    fee_payer: "buyer",
    settlement_delay_hours: 24,
    auto_release_enabled: 0,
    support_phone: "+234800ESXCROWISE",
    support_email: "support@esxcrowise.com",
    updated_at: now(),
  },
  sellers: [
    {
      id: "SELLER-ADA",
      business_name: "Ada Kicks",
      owner_name: "Ada Nwosu",
      phone: "+2348032218901",
      category: "Fashion",
      location: "Lagos",
      bank_name: "Moniepoint",
      bank_account_name: "ADA NWOSU",
      verification_status: "verified",
      bank_verification_status: "verified",
      verification_notes: "Demo seller approved for launch testing.",
      admin_notes: "",
      trust_score: 98,
      completed_orders: 417,
      dispute_count: 3,
      created_at: now(),
      updated_at: now(),
    },
  ] as Row[],
  escrows: [] as Row[],
  disputes: [] as Row[],
  events: [] as Row[],
  applications: [] as Row[],
  pilotSellers: [
    {
      id: "PILOT-ADA-KICKS",
      business_name: "Ada Kicks",
      category: "Fashion",
      location: "Lagos",
      owner_phone: "+2348032218901",
      readiness_status: "active",
      target_orders: 10,
      notes: "Use for first public buyer checkout test.",
      created_at: now(),
      updated_at: now(),
    },
  ] as Row[],
  templates: [
    {
      id: "TPL-PAYMENT-LINK",
      name: "Protected payment link",
      channel: "whatsapp",
      body: "Hi {{buyer_name}}, pay safely for {{item_name}} with Esxcrowise: {{escrow_link}}",
      created_at: now(),
      updated_at: now(),
    },
  ] as Row[],
  messageLogs: [] as Row[],
  settlementEntries: [] as Row[],
};

seedEscrow();

export async function initDb() {}

export async function getDashboard() {
  return {
    sellers: [...state.sellers],
    escrows: state.escrows.map(withSeller),
    disputes: state.disputes.map(withDisputeJoins),
    events: [...state.events].sort(desc("created_at")).slice(0, 20),
    applications: [...state.applications].sort(desc("created_at")),
    pilotSellers: [...state.pilotSellers],
    templates: [...state.templates],
    messageLogs: [...state.messageLogs],
    settlementEntries: [...state.settlementEntries],
    opsChecklist: getOpsChecklist(),
    integrationReadiness: getIntegrationReadiness(),
    settings: state.settings,
    summary: getSummary(),
  };
}

export async function createEscrow(input: EscrowInput) {
  const sellerId = input.sellerId || `SELLER-${slug(input.sellerBusinessName) || id("SELLER")}`;
  let seller = state.sellers.find((row) => row.id === sellerId);
  if (!seller) {
    seller = {
      id: sellerId,
      business_name: input.sellerBusinessName,
      owner_name: input.sellerOwnerName,
      phone: input.sellerPhone,
      category: input.sellerCategory,
      location: input.sellerLocation,
      bank_name: "",
      bank_account_name: "",
      verification_status: "pending",
      bank_verification_status: "not_checked",
      verification_notes: "",
      admin_notes: "",
      trust_score: 72,
      completed_orders: 0,
      dispute_count: 0,
      created_at: now(),
      updated_at: now(),
    };
    state.sellers.unshift(seller);
  }

  const itemAmountKobo = Math.max(0, Math.round(Number(input.amountNaira) * 100));
  const pricing = pricingFor({
    itemAmountKobo,
    feeModel: input.feeModel || state.settings.fee_model,
    feePercent: input.feePercent ?? state.settings.fee_percent / 100,
    fixedFeeNaira: input.fixedFeeNaira ?? state.settings.fixed_fee_kobo / 100,
    feePayer: input.feePayer || state.settings.fee_payer,
  });
  const escrowId = id("ESC");
  const link = `${getPublicBaseUrl()}/pay/${escrowId.toLowerCase()}`;
  const message = `Hi ${input.buyerName || "there"}, please pay ${formatNaira(
    pricing.buyerPaysKobo
  )} safely for ${input.itemName} using Esxcrowise. Commission: ${formatNaira(
    pricing.feeKobo
  )} paid by ${pricing.feePayer}. Your money is protected until delivery is confirmed. ${link}`;

  state.escrows.unshift({
    id: escrowId,
    seller_id: sellerId,
    buyer_name: input.buyerName,
    buyer_phone: input.buyerPhone,
    item_name: input.itemName,
    category: input.category,
    item_amount_kobo: itemAmountKobo,
    amount_kobo: pricing.buyerPaysKobo,
    fee_kobo: pricing.feeKobo,
    fee_model: pricing.feeModel,
    fee_percent: pricing.feePercentBasisPoints,
    fixed_fee_kobo: pricing.fixedFeeKobo,
    fee_payer: pricing.feePayer,
    seller_receives_kobo: pricing.sellerReceivesKobo,
    delivery_window: input.deliveryWindow,
    status: "payment_pending",
    risk_level: riskFor(pricing.buyerPaysKobo, input.category),
    settlement_status: "not_due",
    admin_hold_reason: "",
    released_at: "",
    refunded_at: "",
    payment_reference: "",
    escrow_link: link,
    whatsapp_message: message,
    created_at: now(),
    updated_at: now(),
  });
  addEvent(escrowId, "seller", "escrow_created", "Seller created a protected payment link.");
  return getEscrow(escrowId);
}

export async function initializePayment(escrowId: string, _buyerEmail: string, origin: string) {
  const escrow = findEscrow(escrowId);
  const reference = escrow.payment_reference || `${escrow.id}-${Date.now()}`;
  Object.assign(escrow, {
    payment_reference: reference,
    status: "payment_pending",
    updated_at: now(),
  });
  addEvent(escrow.id, "system", "payment_initialized", "Mock payment initialized.");
  return {
    provider: "mock",
    authorizationUrl: `${origin}/?mock_payment_reference=${encodeURIComponent(reference)}`,
    accessCode: "mock_access_code",
    reference,
  };
}

export async function verifyPaystackPayment(reference: string) {
  const escrow = state.escrows.find((row) => row.payment_reference === reference);
  if (!escrow) throw new Error("No escrow matched this payment reference.");
  escrow.status = "paid";
  escrow.updated_at = now();
  recordSettlement(escrow, "paid", "Mock payment verified.");
  addEvent(escrow.id, "paystack", "payment_verified", "Payment verified and escrow marked as paid.");
  return { paid: true, escrowId: escrow.id };
}

export async function processPaystackWebhook() {
  return { received: true, mock: true };
}

export async function sendWhatsAppMessage(input: {
  escrowId?: string;
  templateId?: string;
  recipientPhone: string;
  body?: string;
}) {
  const escrow = input.escrowId ? findEscrow(input.escrowId) : state.escrows[0];
  if (!escrow) throw new Error("Escrow not found.");
  const body = input.body || escrow.whatsapp_message;
  const log = {
    id: id("MSG"),
    escrow_id: escrow.id,
    template_id: input.templateId || "",
    recipient_phone: input.recipientPhone || escrow.buyer_phone,
    body,
    status: "prepared",
    provider_message_id: "",
    created_at: now(),
  };
  state.messageLogs.unshift(log);
  addEvent(escrow.id, "system", "whatsapp_message_prepared", body);
  return { status: "prepared", body, log };
}

export async function getEscrow(escrowId: string) {
  const escrow = state.escrows.find((row) => row.id.toLowerCase() === escrowId.toLowerCase());
  return {
    escrow: escrow ? withSeller(escrow) : null,
    events: state.events.filter((row) => row.escrow_id.toLowerCase() === escrowId.toLowerCase()),
  };
}

export async function updateEscrowStatus(escrowId: string, status: EscrowStatus, actor: string, note: string) {
  const escrow = findEscrow(escrowId);
  escrow.status = status;
  escrow.updated_at = now();
  if (status === "released") {
    escrow.released_at = now();
    escrow.settlement_status = "settled";
  }
  if (status === "refunded") {
    escrow.refunded_at = now();
    escrow.settlement_status = "refunded";
  }
  recordSettlement(escrow, status, note);
  addEvent(escrow.id, actor, status, note);
  return getEscrow(escrow.id);
}

export async function openDispute(escrowId: string, reason: string, evidenceNote: string) {
  const escrow = findEscrow(escrowId);
  const disputeId = id("DSP");
  escrow.status = "disputed";
  escrow.updated_at = now();
  state.disputes.unshift({
    id: disputeId,
    escrow_id: escrow.id,
    opened_by: "buyer",
    reason,
    evidence_note: evidenceNote,
    status: "open",
    resolution: "",
    priority: "normal",
    assigned_to: "",
    admin_note: "",
    created_at: now(),
    updated_at: now(),
  });
  addEvent(escrow.id, "buyer", "dispute_opened", reason);
  return { disputeId, ...(await getDashboard()) };
}

export async function resolveDispute(disputeId: string, resolution: string, adminNote = "") {
  const dispute = findDispute(disputeId);
  const nextStatus = resolution === "refund_buyer" ? "refunded" : "released";
  dispute.status = "resolved";
  dispute.resolution = resolution;
  dispute.admin_note = adminNote;
  dispute.updated_at = now();
  await updateEscrowStatus(dispute.escrow_id, nextStatus, "admin", `${resolution}. ${adminNote}`);
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
  const seller = findSeller(sellerId);
  seller.verification_status = input.verificationStatus || seller.verification_status;
  seller.bank_verification_status = input.bankVerificationStatus || seller.bank_verification_status;
  seller.trust_score = Math.max(0, Math.min(100, Number(input.trustScore ?? seller.trust_score)));
  seller.verification_notes = input.verificationNotes ?? seller.verification_notes;
  seller.admin_notes = input.adminNotes ?? seller.admin_notes;
  seller.updated_at = now();
  addEvent("", "admin", "seller_verification_updated", `${seller.business_name} updated.`);
  return getDashboard();
}

export async function adminEscrowAction(
  escrowId: string,
  action: "hold" | "release" | "refund" | "mark_delivery_pending" | "clear_hold",
  note = ""
) {
  const statusByAction = {
    hold: "disputed",
    release: "released",
    refund: "refunded",
    mark_delivery_pending: "delivery_pending",
    clear_hold: "paid",
  } as const;
  const escrow = findEscrow(escrowId);
  escrow.admin_hold_reason = action === "hold" ? note || "Admin hold for review." : "";
  return updateEscrowStatus(escrow.id, statusByAction[action], "admin", note || action);
}

export async function updateDisputeAdmin(
  disputeId: string,
  input: { priority?: string; assignedTo?: string; adminNote?: string }
) {
  const dispute = findDispute(disputeId);
  dispute.priority = input.priority || dispute.priority;
  dispute.assigned_to = input.assignedTo ?? dispute.assigned_to;
  dispute.admin_note = input.adminNote ?? dispute.admin_note;
  dispute.updated_at = now();
  addEvent(dispute.escrow_id, "admin", "dispute_admin_updated", dispute.admin_note);
  return getDashboard();
}

export async function getPlatformSettings() {
  return state.settings;
}

export async function updatePlatformSettings(input: PlatformSettingsInput) {
  state.settings.fee_model =
    input.feeModel === "fixed" ? "fixed" : input.feeModel === "percentage" ? "percentage" : state.settings.fee_model;
  state.settings.fee_percent = Math.max(0, Math.round(Number(input.feePercent ?? state.settings.fee_percent / 100) * 100));
  state.settings.fixed_fee_kobo = Math.max(0, Math.round(Number(input.fixedFeeNaira ?? state.settings.fixed_fee_kobo / 100) * 100));
  state.settings.fee_payer =
    input.feePayer === "seller" ? "seller" : input.feePayer === "buyer" ? "buyer" : state.settings.fee_payer;
  state.settings.settlement_delay_hours = Math.max(0, Math.round(Number(input.settlementDelayHours ?? state.settings.settlement_delay_hours)));
  state.settings.auto_release_enabled =
    typeof input.autoReleaseEnabled === "boolean" ? (input.autoReleaseEnabled ? 1 : 0) : state.settings.auto_release_enabled;
  state.settings.support_phone = input.supportPhone ?? state.settings.support_phone;
  state.settings.support_email = input.supportEmail ?? state.settings.support_email;
  state.settings.updated_at = now();
  return getDashboard();
}

export async function createSellerApplication(input: SellerApplicationInput) {
  const applicationId = id("APP");
  state.applications.unshift({
    id: applicationId,
    business_name: input.businessName,
    owner_name: input.ownerName,
    phone: input.phone,
    email: input.email,
    category: input.category,
    location: input.location,
    social_handle: input.socialHandle,
    bank_name: input.bankName,
    bank_account_name: input.bankAccountName,
    verification_id_type: input.verificationIdType,
    expected_monthly_orders: Math.max(0, Math.round(Number(input.expectedMonthlyOrders) || 0)),
    notes: input.notes,
    status: "new",
    admin_note: "",
    created_at: now(),
    updated_at: now(),
  });
  return { applicationId, status: "new" };
}

export async function updateSellerApplication(
  applicationId: string,
  input: { status?: string; adminNote?: string; promoteToPilot?: boolean }
) {
  const application = state.applications.find((row) => row.id === applicationId);
  if (!application) throw new Error("Seller application not found.");
  application.status = input.status || application.status;
  application.admin_note = input.adminNote ?? application.admin_note;
  application.updated_at = now();
  if (input.promoteToPilot) {
    state.pilotSellers.unshift({
      id: `PILOT-${slug(application.business_name) || applicationId}`,
      business_name: application.business_name,
      category: application.category,
      location: application.location,
      owner_phone: application.phone,
      readiness_status: "candidate",
      target_orders: Math.max(5, application.expected_monthly_orders || 5),
      notes: application.admin_note || application.notes,
      created_at: now(),
      updated_at: now(),
    });
  }
  return getDashboard();
}

export async function createPilotTestLinks() {
  const created: string[] = [];
  for (const seller of state.pilotSellers.slice(0, 5)) {
    const sellerId = `SELLER-${slug(seller.business_name) || seller.id}`;
    if (state.escrows.some((row) => row.seller_id === sellerId && row.payment_reference.startsWith("PILOT-"))) {
      continue;
    }
    const result = await createEscrow({
      sellerId,
      sellerBusinessName: seller.business_name,
      sellerOwnerName: `${seller.business_name} owner`,
      sellerPhone: seller.owner_phone,
      sellerCategory: seller.category,
      sellerLocation: seller.location,
      buyerName: "Pilot buyer",
      buyerPhone: "+2348000000000",
      itemName: pilotItemFor(seller.category),
      category: seller.category,
      amountNaira: pilotAmountFor(seller.category) / 100,
      deliveryWindow: "24-48 hours",
    });
    const escrow = result.escrow as Row | null;
    if (escrow) {
      escrow.payment_reference = `PILOT-${seller.id}`;
      created.push(escrow.id);
    }
  }
  return { created, ...(await getDashboard()) };
}

function seedEscrow() {
  if (state.escrows.length) return;
  const itemAmountKobo = 8650000;
  const pricing = pricingFor({ itemAmountKobo, feeModel: "percentage", feePercent: 2.5, feePayer: "buyer" });
  state.escrows.push({
    id: "ESC-2407",
    seller_id: "SELLER-ADA",
    buyer_name: "Tola Martins",
    buyer_phone: "+2348062219002",
    item_name: "Nike Dunk Low Sneakers",
    category: "Fashion",
    item_amount_kobo: itemAmountKobo,
    amount_kobo: pricing.buyerPaysKobo,
    fee_kobo: pricing.feeKobo,
    fee_model: pricing.feeModel,
    fee_percent: pricing.feePercentBasisPoints,
    fixed_fee_kobo: pricing.fixedFeeKobo,
    fee_payer: pricing.feePayer,
    seller_receives_kobo: pricing.sellerReceivesKobo,
    delivery_window: "24-48 hours",
    status: "delivery_pending",
    risk_level: "low",
    settlement_status: "not_due",
    admin_hold_reason: "",
    released_at: "",
    refunded_at: "",
    payment_reference: "DEMO-PAYSTACK-REF",
    escrow_link: `${getPublicBaseUrl()}/pay/esc-2407`,
    whatsapp_message: `Hi Tola Martins, please pay safely for Nike Dunk Low Sneakers using Esxcrowise. ${getPublicBaseUrl()}/pay/esc-2407`,
    created_at: now(),
    updated_at: now(),
  });
  addEvent("ESC-2407", "system", "escrow_seeded", "Demo escrow ready for buyer checkout.");
}

function getSummary() {
  const active = state.escrows.filter((row) => ["paid", "delivery_pending", "delivered"].includes(row.status));
  return {
    protectedVolumeKobo: sum(active, "amount_kobo"),
    pendingSettlementKobo: sum(state.escrows.filter((row) => row.status === "delivered"), "seller_receives_kobo"),
    earnedCommissionKobo: sum(state.escrows.filter((row) => row.status === "released"), "fee_kobo"),
    pendingCommissionKobo: sum(active, "fee_kobo"),
    disputedValueKobo: sum(state.escrows.filter((row) => row.status === "disputed"), "amount_kobo"),
    pendingPayments: state.escrows.filter((row) => row.status === "payment_pending").length,
    settlementQueue: state.escrows.filter((row) => row.status === "delivered").length,
    activeDisputes: state.disputes.filter((row) => row.status === "open").length,
  };
}

function withSeller(escrow: Row) {
  const seller = state.sellers.find((row) => row.id === escrow.seller_id) || {};
  return {
    ...escrow,
    business_name: seller.business_name,
    owner_name: seller.owner_name,
    seller_phone: seller.phone,
    verification_status: seller.verification_status,
    trust_score: seller.trust_score,
    completed_orders: seller.completed_orders,
    dispute_count: seller.dispute_count,
  };
}

function withDisputeJoins(dispute: Row) {
  const escrow = state.escrows.find((row) => row.id === dispute.escrow_id) || {};
  const seller = state.sellers.find((row) => row.id === escrow.seller_id) || {};
  return {
    ...dispute,
    item_name: escrow.item_name,
    amount_kobo: escrow.amount_kobo,
    business_name: seller.business_name,
  };
}

function findEscrow(escrowId: string) {
  const escrow = state.escrows.find((row) => row.id.toLowerCase() === escrowId.toLowerCase());
  if (!escrow) throw new Error("Escrow not found.");
  return escrow;
}

function findSeller(sellerId: string) {
  const seller = state.sellers.find((row) => row.id === sellerId);
  if (!seller) throw new Error("Seller not found.");
  return seller;
}

function findDispute(disputeId: string) {
  const dispute = state.disputes.find((row) => row.id === disputeId);
  if (!dispute) throw new Error("Dispute not found.");
  return dispute;
}

function addEvent(escrowId: string, actor: string, type: string, note: string) {
  state.events.unshift({
    id: id("EVT"),
    escrow_id: escrowId,
    actor,
    type,
    note,
    created_at: now(),
  });
}

function recordSettlement(escrow: Row, status: string, note: string) {
  if (!["paid", "delivered", "released", "refunded"].includes(status)) return;
  state.settlementEntries.unshift({
    id: id("SET"),
    escrow_id: escrow.id,
    entry_type: status,
    amount_kobo: status === "released" ? escrow.seller_receives_kobo : escrow.amount_kobo,
    fee_kobo: escrow.fee_kobo,
    seller_receives_kobo: escrow.seller_receives_kobo,
    status: status === "paid" || status === "delivered" ? "pending" : "completed",
    note,
    created_at: now(),
  });
}

function getOpsChecklist() {
  return [
    { id: "legal-docs", title: "Publish policy pages", status: "ready", note: "Terms and buyer protection pages are available." },
    { id: "seller-kyc", title: "Review seller applications", status: "ready", note: "Seller onboarding collects KYC and bank details." },
    { id: "pilot", title: "Start 5-10 seller pilot", status: "ready", note: "Pilot sellers can use protected WhatsApp links." },
    { id: "support", title: "Assign dispute operator", status: "needs-owner", note: "One operator should review disputes daily." },
    { id: "domain", title: "Connect public domain", status: "ready", note: "Use esxcrowise.com as the public base URL." },
  ];
}

function getIntegrationReadiness() {
  const publicBaseUrl = getPublicBaseUrl();
  return {
    paystack: {
      status: "waiting_for_keys",
      note: "Add PAYSTACK_SECRET_KEY after Paystack approval. Until then, checkout stays in mock mode.",
      requiredEnv: ["PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"],
      configuredCount: 0,
      webhookUrl: `${publicBaseUrl}/api/payments/paystack/webhook`,
      callbackUrl: `${publicBaseUrl}/api/payments/paystack/callback`,
    },
    whatsapp: {
      status: "waiting_for_meta",
      note: "Add Meta WhatsApp access token and phone number ID. Until then, the app prepares copyable messages.",
      requiredEnv: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_BUSINESS_ACCOUNT_ID"],
      configuredCount: 0,
    },
    domain: {
      status: "configured",
      currentPublicBaseUrl: publicBaseUrl,
      candidates: ["esxcrowise.com", "esxcrowise.ng", "useesxcrowise.com"],
      nextAction: "Point DNS to the deployment provider, then set PUBLIC_BASE_URL.",
    },
    pilot: {
      status: "ready_to_test",
      targetSellers: 5,
      targetOrdersPerSeller: 3,
      nextAction: "Create pilot test links for the first five sellers and send them through WhatsApp.",
    },
  };
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
  const feeKobo = feeModel === "fixed" ? fixedFeeKobo : Math.max(50000, Math.round(input.itemAmountKobo * (feePercent / 100)));
  return {
    feeModel,
    feePercentBasisPoints: Math.round(feePercent * 100),
    fixedFeeKobo,
    feePayer,
    feeKobo,
    buyerPaysKobo: feePayer === "buyer" ? input.itemAmountKobo + feeKobo : input.itemAmountKobo,
    sellerReceivesKobo: Math.max(0, feePayer === "seller" ? input.itemAmountKobo - feeKobo : input.itemAmountKobo),
  };
}

function riskFor(amountKobo: number, category: string) {
  if (amountKobo >= 30000000 || /phone|gadget|electronics/i.test(category)) return "high";
  if (amountKobo >= 12000000 || /wig|hair/i.test(category)) return "medium";
  return "low";
}

function pilotAmountFor(category: string) {
  if (/gadget/i.test(category)) return 18500000;
  if (/furniture/i.test(category)) return 14500000;
  if (/hair|wig/i.test(category)) return 9500000;
  if (/perfume/i.test(category)) return 4200000;
  return 8650000;
}

function pilotItemFor(category: string) {
  if (/gadget/i.test(category)) return "Pilot smartphone order";
  if (/furniture/i.test(category)) return "Pilot home furniture order";
  if (/hair|wig/i.test(category)) return "Pilot wig order";
  if (/perfume/i.test(category)) return "Pilot perfume order";
  return "Pilot fashion order";
}

function getPublicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "https://esxcrowise.com";
}

function id(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`.toUpperCase();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sum(rows: Row[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function desc(key: string) {
  return (a: Row, b: Row) => String(b[key]).localeCompare(String(a[key]));
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}
