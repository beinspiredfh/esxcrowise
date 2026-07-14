# Esxcrowise MVP

Esxcrowise is a WhatsApp-first escrow MVP for Nigerian social commerce. A seller creates a protected payment link, sends it to a buyer on WhatsApp, and Esxcrowise holds the money until delivery is confirmed or a dispute is reviewed.

## What Is Built

- Seller/operator dashboard at `/`
- Public buyer checkout at `/pay/:escrowId`
- D1-backed records for sellers, escrows, disputes, and event history
- Pricing support for percentage or fixed Esxcrowise commission
- Paystack payment initialization with a local mock fallback
- Paystack verification and webhook routes
- Buyer delivery confirmation and dispute reporting

## Local Setup

```bash
pnpm install
pnpm run dev
```

The local app runs at `http://localhost:3000`.

Useful demo links:

- Dashboard: `http://localhost:3000/`
- Buyer link: `http://localhost:3000/pay/esc-2407`

## Pricing

The MVP supports two fee styles:

- Percentage fee: default `2.5%`, minimum `NGN 500`
- Fixed fee: default `NGN 1,000`

The fee can be paid by either the buyer or seller. The current recommended launch model is buyer-paid `2.5%` because it is simple for SMEs and scales with order value.

## WhatsApp Flow

Esxcrowise does not need a WhatsApp bot on day one.

1. Seller creates an escrow order in the dashboard.
2. Esxcrowise generates a public `/pay/:escrowId` link.
3. Seller sends the generated message to the buyer on WhatsApp.
4. Buyer opens the link, reviews seller trust details, and pays.
5. Esxcrowise records payment activity.
6. Buyer confirms delivery or opens a dispute.
7. Esxcrowise releases, refunds, or reviews the transaction.

Later, the same flow can be automated with the WhatsApp Business Platform.

## Paystack Setup

Local demos work without a Paystack key. In that case, payment initialization returns a mock checkout link and records a demo payment reference.

For live Paystack checkout, set:

```bash
PAYSTACK_SECRET_KEY=sk_live_or_test_key
```

Routes already included:

- `POST /api/payments/initialize`
- `GET /api/payments/paystack/callback`
- `POST /api/payments/paystack/webhook`

## Admin Access

Set `ADMIN_ACCESS_KEY` in the hosting environment before going live. The operations dashboard stores this key only in the browser session and sends it as `x-admin-key` when calling protected admin APIs.

Admin-protected areas include dashboard data, escrow creation, seller verification, platform fee settings, settlement actions, dispute admin updates, pilot test creation, and WhatsApp message sending.

## Deployment Notes

This project is a Vinext app designed for OpenAI Sites and Cloudflare-compatible deployment. `.openai/hosting.json` declares the D1 binding as `DB`; Sites owns the real hosted resource wiring.

Before launch:

- Set `ADMIN_ACCESS_KEY` in production.
- Configure Paystack secret in the hosting environment.
- Run the D1 migrations in `drizzle/`.
- Add operational policies for seller verification, settlement timing, dispute review, refunds, and prohibited goods.
- Register the business, open a settlement bank account, and review escrow/payment obligations with Nigerian counsel.

## Commands

```bash
pnpm run build
pnpm run dev
pnpm run db:generate
```
