"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Seller = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  category: string;
  location: string;
  verification_status: string;
  bank_verification_status?: string;
  verification_notes?: string;
  admin_notes?: string;
  trust_score: number;
  completed_orders: number;
  dispute_count: number;
};

type Escrow = {
  id: string;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  item_name: string;
  category: string;
  item_amount_kobo?: number;
  amount_kobo: number;
  fee_kobo: number;
  fee_model?: string;
  fee_percent?: number;
  fixed_fee_kobo?: number;
  fee_payer?: string;
  seller_receives_kobo: number;
  delivery_window: string;
  status: string;
  risk_level: string;
  settlement_status?: string;
  admin_hold_reason?: string;
  released_at?: string;
  refunded_at?: string;
  escrow_link: string;
  whatsapp_message: string;
  payment_reference?: string;
  business_name?: string;
  trust_score?: number;
};

type Dispute = {
  id: string;
  escrow_id: string;
  opened_by: string;
  reason: string;
  evidence_note: string;
  status: string;
  resolution: string;
  priority?: string;
  assigned_to?: string;
  admin_note?: string;
  item_name?: string;
  amount_kobo?: number;
  business_name?: string;
};

type EventRecord = {
  id: string;
  escrow_id: string;
  actor: string;
  type: string;
  note: string;
  created_at: string;
};

type Dashboard = {
  sellers: Seller[];
  escrows: Escrow[];
  disputes: Dispute[];
  events: EventRecord[];
  applications?: SellerApplication[];
  pilotSellers?: PilotSeller[];
  templates?: MessageTemplate[];
  messageLogs?: MessageLog[];
  settlementEntries?: SettlementEntry[];
  opsChecklist?: OpsChecklistItem[];
  integrationReadiness?: IntegrationReadiness;
  settings?: PlatformSettings;
  summary?: AdminSummary;
};

type SellerApplication = {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  category: string;
  location: string;
  social_handle: string;
  bank_name: string;
  bank_account_name: string;
  verification_id_type: string;
  expected_monthly_orders: number;
  notes: string;
  status: string;
  admin_note: string;
};

type PilotSeller = {
  id: string;
  business_name: string;
  category: string;
  location: string;
  owner_phone: string;
  readiness_status: string;
  target_orders: number;
  notes: string;
};

type MessageTemplate = {
  id: string;
  name: string;
  channel: string;
  body: string;
};

type MessageLog = {
  id: string;
  escrow_id: string;
  template_id: string;
  recipient_phone: string;
  provider: string;
  status: string;
  body: string;
  error_message: string;
  created_at: string;
};

type SettlementEntry = {
  id: string;
  escrow_id: string;
  account_type: string;
  entry_type: string;
  direction: string;
  amount_kobo: number;
  status: string;
  note: string;
  created_at: string;
  posted_at: string;
};

type OpsChecklistItem = {
  id: string;
  title: string;
  status: string;
  note: string;
};

type IntegrationReadiness = {
  paystack: {
    status: string;
    note: string;
    requiredEnv: string[];
    configuredCount: number;
    webhookUrl: string;
    callbackUrl: string;
  };
  whatsapp: {
    status: string;
    note: string;
    requiredEnv: string[];
    configuredCount: number;
  };
  domain: {
    status: string;
    currentPublicBaseUrl: string;
    candidates: string[];
    nextAction: string;
  };
  pilot: {
    status: string;
    targetSellers: number;
    targetOrdersPerSeller: number;
    nextAction: string;
  };
};

type PlatformSettings = {
  fee_model: string;
  fee_percent: number;
  fixed_fee_kobo: number;
  fee_payer: string;
  settlement_delay_hours: number;
  auto_release_enabled: number;
  support_phone: string;
  support_email: string;
};

type AdminSummary = {
  protectedVolumeKobo: number;
  pendingSettlementKobo: number;
  earnedCommissionKobo: number;
  pendingCommissionKobo: number;
  disputedValueKobo: number;
  pendingPayments: number;
  settlementQueue: number;
  activeDisputes: number;
};

const emptyDashboard: Dashboard = {
  sellers: [],
  escrows: [],
  disputes: [],
  events: [],
};

const initialForm = {
  sellerBusinessName: "Ada Kicks",
  sellerOwnerName: "Ada Nwosu",
  sellerPhone: "+2348032218901",
  sellerCategory: "Fashion",
  sellerLocation: "Lagos",
  buyerName: "Chinedu Okafor",
  buyerPhone: "+2348032218901",
  itemName: "Nike Dunk Low, size 42",
  category: "Fashion",
  amountNaira: "86500",
  feeModel: "percentage",
  feePercent: "2.5",
  fixedFeeNaira: "1000",
  feePayer: "buyer",
  deliveryWindow: "Today before 6 PM",
};

const initialSettingsForm = {
  feeModel: "percentage",
  feePercent: "2.5",
  fixedFeeNaira: "1000",
  feePayer: "buyer",
  settlementDelayHours: "24",
  autoReleaseEnabled: "false",
  supportPhone: "+234800ESXCROWISE",
  supportEmail: "support@esxcrowise.com",
};

const adminKeyStorageKey = "esxcrowise-admin-key";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data as T;
}

export default function Home() {
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [form, setForm] = useState(initialForm);
  const [activeId, setActiveId] = useState("ESC-2407");
  const [adminKey, setAdminKey] = useState("");
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("buyer@esxcrowise.com");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("TPL-PAYMENT-LINK");
  const [adminNote, setAdminNote] = useState("Manual admin review from operations desk.");
  const [sellerVerificationStatus, setSellerVerificationStatus] = useState("pending");
  const [sellerBankStatus, setSellerBankStatus] = useState("not_checked");
  const [sellerTrustScore, setSellerTrustScore] = useState("72");
  const [sellerAdminNotes, setSellerAdminNotes] = useState("");
  const [settingsForm, setSettingsForm] = useState(initialSettingsForm);
  const [disputeAdminNotes, setDisputeAdminNotes] = useState<Record<string, string>>({});
  const [applicationNotes, setApplicationNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("Loading Esxcrowise records...");

  const activeEscrow = useMemo(
    () => dashboard.escrows.find((escrow) => escrow.id === activeId) || dashboard.escrows[0],
    [activeId, dashboard.escrows]
  );

  const activeSeller = useMemo(
    () =>
      dashboard.sellers.find((seller) => seller.id === activeEscrow?.seller_id) ||
      dashboard.sellers[0],
    [activeEscrow?.seller_id, dashboard.sellers]
  );

  const itemAmountKobo = Math.max(0, Number(form.amountNaira.replace(/\D/g, "")) * 100 || 0);
  const feePercent = Math.max(0, Number(form.feePercent) || 0);
  const fixedFeeKobo = Math.max(0, Number(form.fixedFeeNaira.replace(/\D/g, "")) * 100 || 0);
  const feeKobo =
    form.feeModel === "fixed"
      ? fixedFeeKobo
      : Math.max(50000, Math.round(itemAmountKobo * (feePercent / 100)));
  const buyerPaysKobo = form.feePayer === "buyer" ? itemAmountKobo + feeKobo : itemAmountKobo;
  const sellerReceivesKobo =
    form.feePayer === "seller" ? Math.max(0, itemAmountKobo - feeKobo) : itemAmountKobo;

  function adminFetch(input: RequestInfo | URL, init: RequestInit = {}, keyOverride?: string) {
    const headers = new Headers(init.headers);
    const key = keyOverride ?? adminKey;

    if (key) {
      headers.set("x-admin-key", key);
    }

    return fetch(input, { ...init, headers });
  }

  async function loadDashboard(
    nextNotice = "Esxcrowise dashboard is live.",
    keyOverride?: string,
  ) {
    setLoading(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch("/api/dashboard", undefined, keyOverride),
      );
      setDashboard(data);
      setActiveId((current) => data.escrows.find((escrow) => escrow.id === current)?.id || data.escrows[0]?.id || "");
      if (data.settings) {
        setSettingsForm({
          feeModel: data.settings.fee_model,
          feePercent: `${data.settings.fee_percent / 100}`,
          fixedFeeNaira: `${Math.round(data.settings.fixed_fee_kobo / 100)}`,
          feePayer: data.settings.fee_payer,
          settlementDelayHours: `${data.settings.settlement_delay_hours}`,
          autoReleaseEnabled: data.settings.auto_release_enabled ? "true" : "false",
          supportPhone: data.settings.support_phone,
          supportEmail: data.settings.support_email,
        });
      }
      setNotice(nextNotice);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the MVP.";
      if (/admin access key/i.test(message)) {
        window.sessionStorage.removeItem(adminKeyStorageKey);
        setAdminKey("");
      }
      setNotice(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem(adminKeyStorageKey) || "";

    if (!savedKey) {
      setLoading(false);
      setNotice("Enter the Esxcrowise admin access key to open the operations dashboard.");
      return;
    }

    setAdminKey(savedKey);
    setAdminKeyInput(savedKey);
    loadDashboard("Esxcrowise dashboard is live.", savedKey);
  }, []);

  async function unlockAdmin(event: FormEvent) {
    event.preventDefault();
    const nextKey = adminKeyInput.trim();

    if (!nextKey) {
      setNotice("Enter the Esxcrowise admin access key.");
      return;
    }

    setAdminKey(nextKey);
    window.sessionStorage.setItem(adminKeyStorageKey, nextKey);
    await loadDashboard("Admin access confirmed.", nextKey);
  }

  function lockAdmin() {
    window.sessionStorage.removeItem(adminKeyStorageKey);
    setAdminKey("");
    setAdminKeyInput("");
    setDashboard(emptyDashboard);
    setNotice("Admin dashboard locked.");
  }

  useEffect(() => {
    if (!activeSeller) return;
    setSellerVerificationStatus(activeSeller.verification_status || "pending");
    setSellerBankStatus(activeSeller.bank_verification_status || "not_checked");
    setSellerTrustScore(`${activeSeller.trust_score || 72}`);
    setSellerAdminNotes(activeSeller.admin_notes || activeSeller.verification_notes || "");
  }, [activeSeller?.id]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function createEscrow(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await readJson<{ escrow: Escrow }>(
        await adminFetch("/api/escrows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            amountNaira: Number(form.amountNaira.replace(/\D/g, "")) || 0,
            feePercent: Number(form.feePercent) || 0,
            fixedFeeNaira: Number(form.fixedFeeNaira.replace(/\D/g, "")) || 0,
          }),
        })
      );
      await loadDashboard("Escrow link created and saved.");
      if (created.escrow?.id) {
        setActiveId(created.escrow.id);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create escrow.");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: string, note: string) {
    if (!activeEscrow) return;
    setSaving(true);
    try {
      await readJson(
        await adminFetch(`/api/escrows/${activeEscrow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, actor: "operator", note }),
        })
      );
      await loadDashboard(`Transaction moved to ${statusLabel(status)}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update escrow.");
    } finally {
      setSaving(false);
    }
  }

  async function adminEscrowAction(action: string) {
    if (!activeEscrow) return;
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch(`/api/admin/escrows/${activeEscrow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note: adminNote }),
        })
      );
      setDashboard(data);
      setNotice(`Admin action completed: ${statusLabel(action)}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not complete admin action.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSellerAdmin() {
    if (!activeSeller) return;
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch(`/api/admin/sellers/${activeSeller.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationStatus: sellerVerificationStatus,
            bankVerificationStatus: sellerBankStatus,
            trustScore: Number(sellerTrustScore) || activeSeller.trust_score,
            verificationNotes: sellerAdminNotes,
            adminNotes: sellerAdminNotes,
          }),
        })
      );
      setDashboard(data);
      setNotice("Seller verification updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update seller.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feeModel: settingsForm.feeModel,
            feePercent: Number(settingsForm.feePercent) || 0,
            fixedFeeNaira: Number(settingsForm.fixedFeeNaira.replace(/\D/g, "")) || 0,
            feePayer: settingsForm.feePayer,
            settlementDelayHours: Number(settingsForm.settlementDelayHours) || 0,
            autoReleaseEnabled: settingsForm.autoReleaseEnabled === "true",
            supportPhone: settingsForm.supportPhone,
            supportEmail: settingsForm.supportEmail,
          }),
        })
      );
      setDashboard(data);
      setNotice("Platform settings updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update settings.");
    } finally {
      setSaving(false);
    }
  }

  async function initializeCheckout() {
    if (!activeEscrow) return;
    setSaving(true);
    try {
      const result = await readJson<{
        provider: string;
        authorizationUrl: string;
        accessCode: string;
        reference: string;
      }>(
        await adminFetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ escrowId: activeEscrow.id, buyerEmail }),
        })
      );
      setCheckoutUrl(result.authorizationUrl);
      await loadDashboard(`${result.provider} checkout initialized. Reference: ${result.reference}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not initialize checkout.");
    } finally {
      setSaving(false);
    }
  }

  async function createPilotTests() {
    setSaving(true);
    try {
      const data = await readJson<Dashboard & { createdCount?: number; createdEscrowIds?: string[] }>(
        await adminFetch("/api/admin/pilot-tests", {
          method: "POST",
        })
      );
      setDashboard(data);
      const createdCount = data.createdCount || 0;
      setNotice(
        createdCount > 0
          ? `${createdCount} pilot test link${createdCount === 1 ? "" : "s"} created.`
          : "Pilot test links already exist for the first sellers."
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create pilot tests.");
    } finally {
      setSaving(false);
    }
  }

  async function sendWhatsAppForEscrow() {
    if (!activeEscrow) return;
    setSaving(true);
    try {
      const data = await readJson<
        Dashboard & { provider?: string; status?: string; body?: string; note?: string }
      >(
        await adminFetch("/api/integrations/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrowId: activeEscrow.id,
            templateId: selectedTemplateId,
            recipientPhone: activeEscrow.buyer_phone,
          }),
        })
      );
      setDashboard(data);
      setNotice(data.note || `WhatsApp message ${data.status || "prepared"} by ${data.provider || "system"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send WhatsApp message.");
    } finally {
      setSaving(false);
    }
  }

  async function openDispute() {
    if (!activeEscrow) return;
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch("/api/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrowId: activeEscrow.id,
            reason: "Buyer reported an issue with delivery or item condition.",
            evidenceNote: "Collect WhatsApp chat, delivery proof, product photo, and seller response.",
          }),
        })
      );
      setDashboard(data);
      setNotice("Dispute opened and funds paused.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not open dispute.");
    } finally {
      setSaving(false);
    }
  }

  async function updateDisputeAdmin(disputeId: string, priority: string) {
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch(`/api/disputes/${disputeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priority,
            assignedTo: "Esxcrowise Ops",
            adminNote: disputeAdminNotes[disputeId] || "Admin reviewed dispute evidence.",
          }),
        })
      );
      setDashboard(data);
      setNotice("Dispute admin details updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update dispute.");
    } finally {
      setSaving(false);
    }
  }

  async function resolveDispute(disputeId: string, resolution: string) {
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch(`/api/disputes/${disputeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution,
            adminNote: disputeAdminNotes[disputeId] || "Resolved by Esxcrowise operations.",
          }),
        })
      );
      setDashboard(data);
      setNotice(`Dispute resolved: ${statusLabel(resolution)}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not resolve dispute.");
    } finally {
      setSaving(false);
    }
  }

  async function updateApplication(applicationId: string, status: string, promoteToPilot = false) {
    setSaving(true);
    try {
      const data = await readJson<Dashboard>(
        await adminFetch(`/api/admin/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            promoteToPilot,
            adminNote: applicationNotes[applicationId] || "Reviewed by Esxcrowise operations.",
          }),
        })
      );
      setDashboard(data);
      setNotice(`Seller application moved to ${status}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update application.");
    } finally {
      setSaving(false);
    }
  }

  if (!adminKey) {
    return (
      <main className="min-h-screen bg-[#f5fbff] px-5 py-8 text-[#111827]">
        <section className="mx-auto grid min-h-[80vh] max-w-xl content-center">
          <div className="rounded-lg border border-[#bdefff] bg-white p-6 shadow-[0_18px_42px_rgba(15,80,130,0.12)]">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#00a8e8] text-xl font-black text-white">
              E
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-[#ff5a5f]">
              Esxcrowise admin
            </p>
            <h1 className="mt-2 text-3xl font-black">Operations dashboard locked</h1>
            <p className="mt-3 text-sm font-bold text-[#536275]">{notice}</p>
            <form className="mt-5 grid gap-3" onSubmit={unlockAdmin}>
              <Input
                label="Admin access key"
                value={adminKeyInput}
                onChange={setAdminKeyInput}
              />
              <button className="primary" type="submit" disabled={loading}>
                Open dashboard
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#111827]">
      <header className="border-b border-[#bdefff] bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#00a8e8] text-xl font-black text-white shadow-[0_10px_22px_rgba(0,168,232,0.32)]">
              E
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#ff5a5f]">
                Esxcrowise Real MVP
              </p>
              <h1 className="text-2xl font-black sm:text-3xl">
                WhatsApp escrow operations for Nigerian sellers.
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Sellers" value={`${dashboard.sellers.length}`} />
            <Metric label="Escrows" value={`${dashboard.escrows.length}`} />
            <Metric label="Disputes" value={`${dashboard.disputes.length}`} />
          </div>
          <button className="secondary" onClick={lockAdmin}>
            Lock admin
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-4">
        <div className="rounded-lg border border-[#bdefff] bg-white p-3 text-sm font-bold text-[#081a3a] shadow-[0_10px_28px_rgba(15,80,130,0.06)]">
          {loading ? "Loading..." : notice}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <Panel title="Admin Command Center" eyebrow="Backend controls">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Protected volume" value={formatNaira(dashboard.summary?.protectedVolumeKobo || 0)} />
              <Metric label="Settlement queue" value={`${dashboard.summary?.settlementQueue || 0}`} />
              <Metric label="Disputed value" value={formatNaira(dashboard.summary?.disputedValueKobo || 0)} />
              <Metric label="Pending settlement" value={formatNaira(dashboard.summary?.pendingSettlementKobo || 0)} />
              <Metric label="Commission earned" value={formatNaira(dashboard.summary?.earnedCommissionKobo || 0)} />
              <Metric label="Commission pending" value={formatNaira(dashboard.summary?.pendingCommissionKobo || 0)} />
              <Metric label="Pending payments" value={`${dashboard.summary?.pendingPayments || 0}`} />
              <Metric label="Active disputes" value={`${dashboard.summary?.activeDisputes || 0}`} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <a className="secondary grid place-items-center text-center no-underline" href="/policies">
                Open policy center
              </a>
              <a className="primary grid place-items-center text-center no-underline" href="/seller-onboarding">
                Open seller onboarding
              </a>
            </div>
          </Panel>

          <Panel title="Esxcrowise Settlement Account" eyebrow="Commission and payouts">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Esxcrowise keeps" value={formatNaira(activeEscrow?.fee_kobo || 0)} />
              <Metric label="Seller payout" value={formatNaira(activeEscrow?.seller_receives_kobo || 0)} />
              <Metric label="Buyer paid" value={formatNaira(activeEscrow?.amount_kobo || 0)} />
            </div>
            <div className="mt-4 rounded-lg border border-[#cdeffd] bg-[#effaff] p-3">
              <p className="text-sm font-bold text-[#081a3a]">
                Money enters Esxcrowise first. The seller payout stays on hold until delivery is confirmed and admin releases it. Esxcrowise commission is recorded separately and becomes earned when seller payout is released.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {(dashboard.settlementEntries || []).length === 0 ? (
                <p className="text-sm font-semibold text-[#536275]">
                  No settlement entries yet. Confirm a payment, delivery, release, or refund to create the ledger.
                </p>
              ) : (
                (dashboard.settlementEntries || []).slice(0, 8).map((entry) => (
                  <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={entry.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong>{statusLabel(entry.entry_type)}</strong>
                        <p className="mt-1 text-sm font-semibold text-[#536275]">
                          {entry.escrow_id} - {statusLabel(entry.account_type)}
                        </p>
                      </div>
                      <span className={`risk ${entry.status === "posted" ? "low" : "medium"}`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <Summary label="Direction" value={entry.direction} />
                      <Summary label="Amount" value={formatNaira(entry.amount_kobo)} />
                      <Summary label="Note" value={entry.note} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Live Launch Readiness" eyebrow="Items 1 to 5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#cdeffd] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <strong>Paystack live payment</strong>
                  <span className={`risk ${dashboard.integrationReadiness?.paystack.status === "ready" ? "low" : "medium"}`}>
                    {dashboard.integrationReadiness?.paystack.status || "checking"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#536275]">
                  {dashboard.integrationReadiness?.paystack.note || "Checking Paystack setup."}
                </p>
                <code className="mt-2 block break-words rounded-lg bg-[#effaff] p-2 text-xs font-bold text-[#081a3a]">
                  Webhook: {dashboard.integrationReadiness?.paystack.webhookUrl || "Not ready"}
                </code>
              </div>
              <div className="rounded-lg border border-[#cdeffd] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <strong>WhatsApp Business</strong>
                  <span className={`risk ${dashboard.integrationReadiness?.whatsapp.status === "ready" ? "low" : "medium"}`}>
                    {dashboard.integrationReadiness?.whatsapp.status || "checking"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#536275]">
                  {dashboard.integrationReadiness?.whatsapp.note || "Checking WhatsApp setup."}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#536275]">
                  {dashboard.integrationReadiness?.whatsapp.configuredCount || 0} of 3 credentials configured
                </p>
              </div>
              <div className="rounded-lg border border-[#cdeffd] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <strong>Pilot sellers</strong>
                  <span className="risk low">{dashboard.integrationReadiness?.pilot.status || "ready"}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#536275]">
                  {dashboard.integrationReadiness?.pilot.nextAction || "Create pilot test links."}
                </p>
                <button className="primary mt-3" disabled={saving} onClick={createPilotTests}>
                  Create pilot test links
                </button>
              </div>
              <div className="rounded-lg border border-[#cdeffd] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <strong>Domain name</strong>
                  <span className="risk medium">{dashboard.integrationReadiness?.domain.status || "select_domain"}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#536275]">
                  {dashboard.integrationReadiness?.domain.nextAction || "Choose and connect a public domain."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(dashboard.integrationReadiness?.domain.candidates || ["esxcrowise.com"]).map((domain) => (
                    <span className="pill" key={domain}>{domain}</span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Launch Operations Checklist" eyebrow="Items 3 to 8">
            <div className="grid gap-3">
              {(dashboard.opsChecklist || []).map((item) => (
                <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <strong>{item.title}</strong>
                    <span className={`risk ${item.status === "ready" ? "low" : "medium"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#536275]">{item.note}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Seller Applications" eyebrow="Verification queue">
            <div className="grid gap-3">
              {(dashboard.applications || []).length === 0 ? (
                <p className="text-sm font-semibold text-[#536275]">
                  No seller applications yet. Share the onboarding page with pilot sellers.
                </p>
              ) : (
                (dashboard.applications || []).map((application) => (
                  <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={application.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong>{application.business_name}</strong>
                        <p className="mt-1 text-sm font-semibold text-[#536275]">
                          {application.owner_name} - {application.phone} - {application.location}
                        </p>
                        <small className="font-bold text-[#081a3a]">
                          {application.category}; {application.expected_monthly_orders} expected monthly orders
                        </small>
                      </div>
                      <span className={`risk ${application.status === "approved" ? "low" : "medium"}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 rounded-lg bg-[#effaff] p-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Summary label="Bank" value={application.bank_name || "Not supplied"} />
                        <Summary label="Account name" value={application.bank_account_name || "Not supplied"} />
                        <Summary label="ID type" value={application.verification_id_type || "Not supplied"} />
                      </div>
                      <Input
                        label="Application admin note"
                        value={applicationNotes[application.id] || application.admin_note || ""}
                        onChange={(value) =>
                          setApplicationNotes((current) => ({ ...current, [application.id]: value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button className="primary" disabled={saving} onClick={() => updateApplication(application.id, "approved", true)}>
                          Approve and add to pilot
                        </button>
                        <button className="secondary" disabled={saving} onClick={() => updateApplication(application.id, "more_info")}>
                          Request more info
                        </button>
                        <button className="secondary" disabled={saving} onClick={() => updateApplication(application.id, "rejected")}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Platform Settings" eyebrow="Pricing and support">
            <form onSubmit={updateSettings}>
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Default fee model" value={settingsForm.feeModel} onChange={(value) => setSettingsForm((current) => ({ ...current, feeModel: value }))} options={["percentage", "fixed"]} />
                <Input label="Default percentage fee" value={settingsForm.feePercent} onChange={(value) => setSettingsForm((current) => ({ ...current, feePercent: value.replace(/[^0-9.]/g, "") }))} />
                <Input label="Default fixed fee" value={settingsForm.fixedFeeNaira} onChange={(value) => setSettingsForm((current) => ({ ...current, fixedFeeNaira: value.replace(/\D/g, "") }))} inputMode="numeric" />
                <Select label="Default fee payer" value={settingsForm.feePayer} onChange={(value) => setSettingsForm((current) => ({ ...current, feePayer: value }))} options={["buyer", "seller"]} />
                <Input label="Settlement delay hours" value={settingsForm.settlementDelayHours} onChange={(value) => setSettingsForm((current) => ({ ...current, settlementDelayHours: value.replace(/\D/g, "") }))} inputMode="numeric" />
                <Select label="Auto release" value={settingsForm.autoReleaseEnabled} onChange={(value) => setSettingsForm((current) => ({ ...current, autoReleaseEnabled: value }))} options={["false", "true"]} />
                <Input label="Support phone" value={settingsForm.supportPhone} onChange={(value) => setSettingsForm((current) => ({ ...current, supportPhone: value }))} />
                <Input label="Support email" value={settingsForm.supportEmail} onChange={(value) => setSettingsForm((current) => ({ ...current, supportEmail: value }))} />
              </div>
              <button className="primary mt-4" disabled={saving}>
                Save platform settings
              </button>
            </form>
          </Panel>

          <Panel title="Create Escrow Transaction" eyebrow="Seller workspace">
            <form onSubmit={createEscrow}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Seller business" value={form.sellerBusinessName} onChange={(value) => updateForm("sellerBusinessName", value)} />
                <Input label="Seller owner" value={form.sellerOwnerName} onChange={(value) => updateForm("sellerOwnerName", value)} />
                <Input label="Seller phone" value={form.sellerPhone} onChange={(value) => updateForm("sellerPhone", value)} />
                <Input label="Seller location" value={form.sellerLocation} onChange={(value) => updateForm("sellerLocation", value)} />
                <Select label="Seller category" value={form.sellerCategory} onChange={(value) => updateForm("sellerCategory", value)} options={["Fashion", "Gadgets", "Hair and wigs", "Perfume", "Furniture"]} />
                <Input label="Buyer name" value={form.buyerName} onChange={(value) => updateForm("buyerName", value)} />
                <Input label="Buyer WhatsApp" value={form.buyerPhone} onChange={(value) => updateForm("buyerPhone", value)} />
                <Input label="Item name" value={form.itemName} onChange={(value) => updateForm("itemName", value)} />
                <Select label="Item category" value={form.category} onChange={(value) => updateForm("category", value)} options={["Fashion", "Gadgets", "Hair and wigs", "Perfume", "Furniture"]} />
                <Input label="Item price" value={form.amountNaira} onChange={(value) => updateForm("amountNaira", value.replace(/\D/g, ""))} inputMode="numeric" />
                <Select label="Fee model" value={form.feeModel} onChange={(value) => updateForm("feeModel", value)} options={["percentage", "fixed"]} />
                <Input label="Percentage fee" value={form.feePercent} onChange={(value) => updateForm("feePercent", value.replace(/[^0-9.]/g, ""))} />
                <Input label="Fixed fee" value={form.fixedFeeNaira} onChange={(value) => updateForm("fixedFeeNaira", value.replace(/\D/g, ""))} inputMode="numeric" />
                <Select label="Fee payer" value={form.feePayer} onChange={(value) => updateForm("feePayer", value)} options={["buyer", "seller"]} />
                <Select label="Delivery window" value={form.deliveryWindow} onChange={(value) => updateForm("deliveryWindow", value)} options={["Today before 6 PM", "Tomorrow", "2-3 days", "Pickup by buyer"]} />
              </div>
              <div className="mt-4 grid gap-3 rounded-lg border border-[#bdefff] bg-[#effaff] p-4 md:grid-cols-3">
                <Summary label="Item price" value={formatNaira(itemAmountKobo)} />
                <Summary label="Escrow fee" value={formatNaira(feeKobo)} />
                <Summary label="Buyer pays" value={formatNaira(buyerPaysKobo)} />
                <Summary label="Seller receives" value={formatNaira(sellerReceivesKobo)} />
                <Summary label="Pricing rule" value={form.feeModel === "fixed" ? `Fixed ${formatNaira(fixedFeeKobo)}` : `${feePercent}%`} />
                <Summary label="Fee payer" value={form.feePayer} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className="primary" disabled={saving}>
                  {saving ? "Saving..." : "Create protected link"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Escrow Transactions" eyebrow="Operations desk">
            <div className="grid gap-3">
              {dashboard.escrows.map((escrow) => (
                <button
                  key={escrow.id}
                  className={`transaction ${activeEscrow?.id === escrow.id ? "active" : ""}`}
                  onClick={() => setActiveId(escrow.id)}
                >
                  <span>
                    <strong>{escrow.id}</strong>
                    <small>{escrow.item_name}</small>
                  </span>
                  <span>
                    <strong>{formatNaira(escrow.amount_kobo)}</strong>
                    <small>{statusLabel(escrow.status)}</small>
                  </span>
                  <span className={`risk ${escrow.risk_level}`}>{escrow.risk_level}</span>
                </button>
              ))}
            </div>
            {activeEscrow ? (
              <div className="mt-4 rounded-lg bg-[#081a3a] p-4 text-white shadow-[0_14px_30px_rgba(8,26,58,0.2)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7dd3fc]">
                  Selected transaction
                </p>
                <div className="mt-2 grid gap-3 md:grid-cols-4">
                  <Summary label="Buyer" value={activeEscrow.buyer_name} dark />
                  <Summary label="Seller" value={activeEscrow.business_name || activeEscrow.seller_id} dark />
                  <Summary label="Status" value={statusLabel(activeEscrow.status)} dark />
                  <Summary label="Risk" value={activeEscrow.risk_level} dark />
                  <Summary label="Fee payer" value={activeEscrow.fee_payer || "buyer"} dark />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="primary" disabled={saving} onClick={initializeCheckout}>Initialize checkout</button>
                  <button className="primary" disabled={saving} onClick={() => setStatus("paid", "Payment confirmed by payment partner.")}>Mark paid</button>
                  <button className="primary" disabled={saving} onClick={() => setStatus("delivered", "Buyer confirmed delivery.")}>Confirm delivery</button>
                  <button className="secondary" disabled={saving} onClick={() => adminEscrowAction("release")}>Release funds</button>
                  <button className="secondary" disabled={saving} onClick={() => adminEscrowAction("refund")}>Refund buyer</button>
                  <button className="secondary" disabled={saving} onClick={() => adminEscrowAction("hold")}>Hold for review</button>
                  <button className="secondary" disabled={saving} onClick={() => adminEscrowAction("clear_hold")}>Clear hold</button>
                  <button className="secondary" disabled={saving} onClick={openDispute}>Open dispute</button>
                </div>
                <div className="mt-4 grid gap-3 rounded-lg border border-[#1d4ed8] bg-[#eff6ff] p-3">
                  <Input label="Admin action note" value={adminNote} onChange={setAdminNote} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Summary label="Settlement status" value={activeEscrow.settlement_status || "not_due"} dark />
                    <Summary label="Hold reason" value={activeEscrow.admin_hold_reason || "None"} dark />
                    <Summary label="Released at" value={activeEscrow.released_at || "Not released"} dark />
                  </div>
                </div>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Pilot Seller List" eyebrow="First 5-10 SMEs">
            <div className="grid gap-3">
              {(dashboard.pilotSellers || []).map((seller) => (
                <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={seller.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong>{seller.business_name}</strong>
                      <p className="mt-1 text-sm font-semibold text-[#536275]">
                        {seller.category} - {seller.location} - {seller.owner_phone}
                      </p>
                    </div>
                    <span className={`risk ${seller.readiness_status === "active" ? "low" : "medium"}`}>
                      {seller.readiness_status}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Summary label="Target orders" value={`${seller.target_orders}`} />
                    <Summary label="Notes" value={seller.notes} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="WhatsApp Templates" eyebrow="Manual pilot messages">
            <div className="grid gap-3">
              {(dashboard.templates || []).map((template) => (
                <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={template.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong>{template.name}</strong>
                    <span className="pill">{template.channel}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#536275]">{template.body}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="WhatsApp Message Log" eyebrow="Send history">
            <div className="grid gap-3">
              {(dashboard.messageLogs || []).length === 0 ? (
                <p className="text-sm font-semibold text-[#536275]">
                  No WhatsApp messages logged yet. Use the selected transaction to send or prepare one.
                </p>
              ) : (
                (dashboard.messageLogs || []).map((log) => (
                  <div className="rounded-lg border border-[#cdeffd] bg-white p-3" key={log.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong>{log.recipient_phone}</strong>
                        <p className="mt-1 text-sm font-semibold text-[#536275]">
                          {log.provider} - {log.template_id || "custom message"}
                        </p>
                      </div>
                      <span className={`risk ${log.status === "sent" ? "low" : "medium"}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#536275]">{log.body}</p>
                    {log.error_message ? (
                      <p className="mt-2 text-xs font-bold text-[#c8212b]">{log.error_message}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Buyer Checkout Link" eyebrow="Public payment page">
            {activeEscrow ? (
              <div className="rounded-lg border border-[#bdefff] bg-white p-4">
                <p className="text-sm text-[#536275]">{activeEscrow.business_name} is requesting</p>
                <h2 className="mt-1 text-3xl font-black">{formatNaira(activeEscrow.amount_kobo)}</h2>
                <p className="mt-1 text-sm font-semibold text-[#008a63]">
                  Funds are protected until delivery is confirmed.
                </p>
                <div className="mt-4 grid gap-3 rounded-lg border border-[#bdefff] bg-[#effaff] p-3 sm:grid-cols-3">
                  <Summary label="Item price" value={formatNaira(activeEscrow.item_amount_kobo || activeEscrow.amount_kobo)} />
                  <Summary label="Esxcrowise commission" value={formatNaira(activeEscrow.fee_kobo)} />
                  <Summary label="Seller receives" value={formatNaira(activeEscrow.seller_receives_kobo)} />
                </div>
                <div className="mt-4 rounded-lg bg-[#effaff] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">Escrow link</p>
                  <code className="mt-2 block break-words text-sm font-bold text-[#081a3a]">{activeEscrow.escrow_link}</code>
                </div>
                <div className="mt-3 rounded-lg bg-[#fff5f5] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#c8212b]">WhatsApp message</p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">{activeEscrow.whatsapp_message}</p>
                </div>
                <div className="mt-3 grid gap-3 rounded-lg border border-[#cdeffd] bg-white p-3">
                  <Select
                    label="WhatsApp template"
                    value={selectedTemplateId}
                    onChange={setSelectedTemplateId}
                    options={(dashboard.templates || []).length > 0 ? (dashboard.templates || []).map((template) => template.id) : ["TPL-PAYMENT-LINK"]}
                  />
                  <button className="primary" disabled={saving} onClick={sendWhatsAppForEscrow}>
                    Send or prepare WhatsApp message
                  </button>
                </div>
                <div className="mt-3 grid gap-3 rounded-lg border border-[#cdeffd] bg-white p-3">
                  <Input label="Buyer email for checkout" value={buyerEmail} onChange={setBuyerEmail} />
                  <button className="primary" disabled={saving} onClick={initializeCheckout}>
                    Initialize Paystack checkout
                  </button>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">Payment reference</p>
                    <p className="mt-1 break-words text-sm font-bold text-[#081a3a]">
                      {activeEscrow.payment_reference || "Not initialized yet"}
                    </p>
                  </div>
                  {checkoutUrl ? (
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">Checkout URL</p>
                      <code className="mt-1 block break-words text-sm font-bold text-[#081a3a]">{checkoutUrl}</code>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Seller Trust Passport" eyebrow="Public profile">
            {activeSeller ? (
              <div className="trust-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2>{activeSeller.business_name}</h2>
                    <p>{activeSeller.category} seller, {activeSeller.location}</p>
                  </div>
                  <div className="score" aria-label={`Seller trust score ${activeSeller.trust_score} out of 100`}>
                    <span>{activeSeller.trust_score}</span>
                    <small>Seller trust</small>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Metric label="Orders" value={`${activeSeller.completed_orders}`} compact />
                  <Metric label="Disputes" value={`${activeSeller.dispute_count}`} compact />
                  <Metric label="KYC" value={activeSeller.verification_status} compact />
                </div>
                <div className="mt-5 grid gap-2 text-sm">
                  <Check text="Phone verification tracked" />
                  <Check text="Bank matching status stored" />
                  <Check text="Public trust score available" />
                </div>
                <div className="mt-5 grid gap-3 rounded-lg bg-white/10 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select label="KYC status" value={sellerVerificationStatus} onChange={setSellerVerificationStatus} options={["pending", "verified", "rejected", "suspended"]} />
                    <Select label="Bank status" value={sellerBankStatus} onChange={setSellerBankStatus} options={["not_checked", "matched", "mismatch", "manual_review"]} />
                    <Input label="Trust score" value={sellerTrustScore} onChange={(value) => setSellerTrustScore(value.replace(/\D/g, ""))} inputMode="numeric" />
                    <Input label="Admin notes" value={sellerAdminNotes} onChange={setSellerAdminNotes} />
                  </div>
                  <button className="primary" disabled={saving} onClick={updateSellerAdmin}>
                    Update seller verification
                  </button>
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Dispute Desk" eyebrow="Admin workflow">
            <div className="grid gap-3">
              {dashboard.disputes.length === 0 ? (
                <p className="text-sm font-semibold text-[#536275]">No disputes yet. Open one from the selected transaction.</p>
              ) : (
                dashboard.disputes.map((dispute) => (
                  <div key={dispute.id} className="rounded-lg border border-[#cdeffd] bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong>{dispute.id}</strong>
                        <p className="mt-1 text-sm text-[#536275]">{dispute.reason}</p>
                        <small className="font-bold text-[#081a3a]">{dispute.business_name} - {dispute.item_name}</small>
                      </div>
                      <span className={`risk ${dispute.status === "open" ? "medium" : "low"}`}>{dispute.status}</span>
                    </div>
                    <div className="mt-3 grid gap-2 rounded-lg bg-[#effaff] p-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Summary label="Priority" value={dispute.priority || "normal"} />
                        <Summary label="Assigned to" value={dispute.assigned_to || "Unassigned"} />
                        <Summary label="Admin note" value={dispute.admin_note || "No note"} />
                      </div>
                      <Input
                        label="Dispute admin note"
                        value={disputeAdminNotes[dispute.id] || dispute.admin_note || ""}
                        onChange={(value) =>
                          setDisputeAdminNotes((current) => ({ ...current, [dispute.id]: value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button className="primary" disabled={saving} onClick={() => updateDisputeAdmin(dispute.id, "normal")}>Assign normal</button>
                        <button className="secondary" disabled={saving} onClick={() => updateDisputeAdmin(dispute.id, "urgent")}>Mark urgent</button>
                      </div>
                    </div>
                    {dispute.status === "open" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="primary" disabled={saving} onClick={() => resolveDispute(dispute.id, "release_seller")}>Release seller</button>
                        <button className="secondary" disabled={saving} onClick={() => resolveDispute(dispute.id, "refund_buyer")}>Refund buyer</button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Audit Timeline" eyebrow="Evidence trail">
            <div className="grid gap-2">
              {dashboard.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-[#cdeffd] bg-white p-3">
                  <strong>{statusLabel(event.type)}</strong>
                  <p className="mt-1 text-sm text-[#536275]">{event.note}</p>
                  <small className="font-bold text-[#081a3a]">{event.actor} - {event.escrow_id}</small>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#cdeffd] bg-white p-4 shadow-[0_16px_42px_rgba(15,80,130,0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a5f]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-[#cdeffd] bg-[#effaff] p-3 ${compact ? "" : "min-w-28"}`}>
      <p className="text-lg font-black text-[#081a3a]">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#536275]">
        {label}
      </p>
    </div>
  );
}

function Summary({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? "text-[#7dd3fc]" : "text-[#536275]"}`}>
        {label}
      </p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}

function Check({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 font-semibold text-[#008a63]">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#d9fbe8] text-xs text-[#006b4d]">
        OK
      </span>
      {text}
    </p>
  );
}
