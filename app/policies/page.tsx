const sections = [
  {
    title: "Terms of Use",
    body: [
      "Esxcrowise provides protected payment and transaction tracking for Nigerian social commerce trades started on WhatsApp or similar channels.",
      "Users must provide accurate transaction, delivery, seller, buyer, and payment information.",
      "Esxcrowise may pause, refund, release, or review transactions where fraud, prohibited goods, failed delivery, or conflicting evidence is reported.",
    ],
  },
  {
    title: "Privacy Notice",
    body: [
      "Esxcrowise collects contact details, seller verification information, transaction records, payment references, support notes, and dispute evidence.",
      "This information is used to verify sellers, protect buyers, process payments, resolve disputes, prevent fraud, and support platform operations.",
      "Sensitive payment processing is handled by the payment provider. Esxcrowise should not store card details.",
    ],
  },
  {
    title: "Refund Policy",
    body: [
      "A buyer may request a refund where the seller fails to deliver, delivers a materially different item, or cannot provide reasonable delivery evidence.",
      "Refunds are reviewed using payment records, delivery proof, product photos, WhatsApp conversation evidence, and seller response.",
      "Esxcrowise commission may be retained or refunded depending on the dispute reason, fraud risk, and payment-provider charges.",
    ],
  },
  {
    title: "Dispute Policy",
    body: [
      "Buyers should report an issue before confirming delivery or within the stated inspection window.",
      "Accepted evidence includes item photos, delivery receipts, courier tracking, WhatsApp screenshots, seller response, and proof of payment.",
      "Esxcrowise may release funds to the seller, refund the buyer, request more evidence, or suspend a seller where repeated disputes occur.",
    ],
  },
  {
    title: "Seller Agreement",
    body: [
      "Sellers must provide correct business identity, phone number, bank details, product description, price, and delivery promise.",
      "Sellers must not sell illegal, unsafe, counterfeit, restricted, or misleading products through Esxcrowise.",
      "Repeated failed deliveries, false claims, fake evidence, or abusive conduct may lead to suspension or withheld settlements.",
    ],
  },
  {
    title: "Buyer Protection",
    body: [
      "Buyer payment is protected until the transaction is marked delivered, released by Esxcrowise, or resolved through a dispute.",
      "Buyers must inspect the item promptly and report issues with clear evidence.",
      "Buyer protection does not cover buyer remorse, private side deals, false claims, or transactions completed outside the Esxcrowise link.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-[#f5fbff] px-5 py-8 text-[#111827]">
      <section className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a5f]">
          Esxcrowise launch documents
        </p>
        <h1 className="mt-2 text-4xl font-black">Policies for protected WhatsApp trade</h1>
        <p className="mt-3 max-w-3xl font-semibold text-[#536275]">
          These are operational policy drafts for the MVP pilot. A Nigerian lawyer should review
          them before public launch, especially because Esxcrowise handles payments, refunds, and
          seller verification decisions.
        </p>
        <div className="mt-6 grid gap-4">
          {sections.map((section) => (
            <article
              className="rounded-lg border border-[#cdeffd] bg-white p-5 shadow-[0_16px_42px_rgba(15,80,130,0.08)]"
              key={section.title}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <ul className="mt-4 grid gap-3">
                {section.body.map((item) => (
                  <li className="rounded-lg bg-[#effaff] p-3 font-semibold text-[#536275]" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
