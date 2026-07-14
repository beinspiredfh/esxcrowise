"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Escrow = {
  id: string;
  seller_id: string;
  buyer_name: string;
  buyer_phone: string;
  item_name: string;
  category: string;
  item_amount_kobo: number;
  amount_kobo: number;
  fee_kobo: number;
  fee_model: string;
  fee_percent: number;
  fixed_fee_kobo: number;
  fee_payer: string;
  seller_receives_kobo: number;
  delivery_window: string;
  status: string;
  risk_level: string;
  payment_reference?: string;
  business_name: string;
  owner_name: string;
  seller_phone: string;
  verification_status: string;
  trust_score: number;
  completed_orders: number;
  dispute_count: number;
};

type EventRecord = {
  id: string;
  actor: string;
  type: string;
  note: string;
  created_at: string;
};

type EscrowPayload = {
  escrow: Escrow | null;
  events: EventRecord[];
};

const statusSteps = ["payment_pending", "paid", "delivery_pending", "delivered", "released"];

function formatNaira(kobo = 0) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function statusLabel(status = "") {
  return status.replace(/_/g, " ");
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data as T;
}

export default function PublicEscrowPage() {
  const params = useParams<{ escrowId: string }>();
  const escrowId = String(params.escrowId || "").toUpperCase();
  const [payload, setPayload] = useState<EscrowPayload>({ escrow: null, events: [] });
  const [buyerEmail, setBuyerEmail] = useState("buyer@esxcrowise.com");
  const [disputeNote, setDisputeNote] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [notice, setNotice] = useState("Loading protected payment...");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const escrow = payload.escrow;
  const activeStep = useMemo(() => {
    if (!escrow) return 0;
    if (escrow.status === "disputed" || escrow.status === "refunded") return 2;
    return Math.max(0, statusSteps.indexOf(escrow.status));
  }, [escrow]);

  async function loadEscrow(nextNotice = "Protected payment loaded.") {
    setLoading(true);
    try {
      const data = await readJson<EscrowPayload>(await fetch(`/api/escrows/${escrowId}`));
      setPayload(data);
      setNotice(data.escrow ? nextNotice : "This Esxcrowise link was not found.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load this Esxcrowise link.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (escrowId) {
      loadEscrow();
    }
  }, [escrowId]);

  async function initializeCheckout(event: FormEvent) {
    event.preventDefault();
    if (!escrow) return;
    setBusy(true);
    try {
      const result = await readJson<{
        provider: string;
        authorizationUrl: string;
        reference: string;
      }>(
        await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ escrowId: escrow.id, buyerEmail }),
        })
      );
      setCheckoutUrl(result.authorizationUrl);
      setNotice(`${result.provider} checkout is ready. Reference: ${result.reference}.`);
      await loadEscrow("Payment session created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start payment.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: string, note: string) {
    if (!escrow) return;
    setBusy(true);
    try {
      await readJson<EscrowPayload>(
        await fetch(`/api/escrows/${escrow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, actor: "buyer", note }),
        })
      );
      await loadEscrow(`Transaction marked as ${statusLabel(status)}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update transaction.");
    } finally {
      setBusy(false);
    }
  }

  async function openDispute(event: FormEvent) {
    event.preventDefault();
    if (!escrow) return;
    setBusy(true);
    try {
      await readJson(
        await fetch("/api/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            escrowId: escrow.id,
            reason: disputeNote || "Buyer reported a problem with this order.",
            evidenceNote: disputeNote,
          }),
        })
      );
      setDisputeNote("");
      await updateStatus("disputed", "Buyer opened a delivery or item dispute.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not open dispute.");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !escrow) {
    return (
      <main className="min-h-screen bg-[#f5fbff] px-4 py-8 text-[#111827]">
        <section className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center">
          <p className="rounded-lg border border-[#bdefff] bg-white px-5 py-4 font-black text-[#008a63]">
            {notice}
          </p>
        </section>
      </main>
    );
  }

  if (!escrow) {
    return (
      <main className="min-h-screen bg-[#f5fbff] px-4 py-8 text-[#111827]">
        <section className="mx-auto max-w-2xl rounded-lg border border-[#ffd6d8] bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-[#c8212b]">
            Esxcrowise link
          </p>
          <h1 className="mt-3 text-3xl font-black">Payment not found</h1>
          <p className="mt-3 text-[#536275]">{notice}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#111827]">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
        <div className="grid content-start gap-5">
          <div className="trust-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd166]">
                  Esxcrowise protected payment
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                  Pay only when the trade is protected.
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold">
                  This link came from WhatsApp. Esxcrowise holds the buyer payment while the
                  seller delivers, then releases the money after confirmation.
                </p>
              </div>
              <div className="score trust-score" aria-label={`Seller trust score ${escrow.trust_score} out of 100`}>
                <span>{escrow.trust_score}</span>
                <small>Seller trust</small>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-[#cdeffd] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00a8e8]">
                  Seller
                </p>
                <h2 className="text-2xl font-black">{escrow.business_name}</h2>
                <p className="font-bold text-[#536275]">
                  {escrow.owner_name} • {escrow.seller_phone}
                </p>
              </div>
              <span className="pill done capitalize">{escrow.verification_status}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#e9f6ff] p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">
                  Orders
                </p>
                <strong className="text-2xl">{escrow.completed_orders}</strong>
              </div>
              <div className="rounded-lg bg-[#d9fbe8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">
                  Disputes
                </p>
                <strong className="text-2xl">{escrow.dispute_count}</strong>
              </div>
              <div className="rounded-lg bg-[#fff1c2] p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#536275]">
                  Risk
                </p>
                <strong className="text-2xl capitalize">{escrow.risk_level}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-[#cdeffd] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00a8e8]">
              Progress
            </p>
            <div className="grid gap-3">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className={`status-dot ${index <= activeStep ? "on" : ""}`} />
                  <div>
                    <p className="font-black capitalize">{statusLabel(step)}</p>
                    <p className="text-sm font-semibold text-[#536275]">
                      {index <= activeStep ? "Completed or active" : "Waiting"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#cdeffd] bg-white p-5 shadow-[0_18px_40px_rgba(0,168,232,0.12)]">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00a8e8]">
              Order {escrow.id}
            </p>
            <h2 className="mt-2 text-2xl font-black">{escrow.item_name}</h2>
            <p className="mt-1 font-bold text-[#536275]">{escrow.delivery_window}</p>

            <dl className="mt-5 grid gap-3">
              <div className="flex justify-between gap-4 border-b border-[#e5f6fd] pb-3">
                <dt className="font-bold text-[#536275]">Item price</dt>
                <dd className="font-black">{formatNaira(escrow.item_amount_kobo)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e5f6fd] pb-3">
                <dt className="font-bold text-[#536275]">
                  Esxcrowise commission ({escrow.fee_model}, paid by {escrow.fee_payer})
                </dt>
                <dd className="font-black">{formatNaira(escrow.fee_kobo)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#e5f6fd] pb-3">
                <dt className="font-bold text-[#536275]">Seller receives</dt>
                <dd className="font-black">{formatNaira(escrow.seller_receives_kobo)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-xl">
                <dt className="font-black">Buyer pays today</dt>
                <dd className="font-black text-[#008a63]">{formatNaira(escrow.amount_kobo)}</dd>
              </div>
            </dl>

            <form className="mt-5 grid gap-3" onSubmit={initializeCheckout}>
              <label className="field">
                <span>Email for receipt</span>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  required
                />
              </label>
              <button className="primary" type="submit" disabled={busy}>
                {busy ? "Working..." : "Pay securely"}
              </button>
              {checkoutUrl && (
                <a
                  className="secondary grid place-items-center text-center no-underline"
                  href={checkoutUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open checkout
                </a>
              )}
            </form>

            <div className="mt-4 rounded-lg bg-[#e9f6ff] p-4 text-sm font-bold text-[#536275]">
              {notice}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-[#cdeffd] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00a8e8]">
              After delivery
            </p>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                updateStatus("delivered", "Buyer confirmed item delivery from public link.")
              }
            >
              Confirm delivery
            </button>
            <form className="grid gap-3" onSubmit={openDispute}>
              <label className="field">
                <span>Report an issue</span>
                <input
                  value={disputeNote}
                  onChange={(event) => setDisputeNote(event.target.value)}
                  placeholder="Example: wrong size, item not delivered"
                />
              </label>
              <button className="secondary" disabled={busy} type="submit">
                Report issue
              </button>
            </form>
          </div>

          <div className="grid gap-3 rounded-lg border border-[#cdeffd] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00a8e8]">
              Activity
            </p>
            {payload.events.slice(0, 5).map((event) => (
              <div key={event.id} className="border-b border-[#e5f6fd] pb-3 last:border-0">
                <p className="font-black capitalize">{statusLabel(event.type)}</p>
                <p className="text-sm font-semibold text-[#536275]">{event.note}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
