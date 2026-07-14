"use client";

import { FormEvent, useState } from "react";

const initialForm = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  category: "Fashion",
  location: "Lagos",
  socialHandle: "",
  bankName: "",
  bankAccountName: "",
  verificationIdType: "NIN",
  expectedMonthlyOrders: "10",
  notes: "",
};

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data as T;
}

export default function SellerOnboardingPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("Apply to join the first Esxcrowise SME pilot.");

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitApplication(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await readJson<{ applicationId: string }>(
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            expectedMonthlyOrders: Number(form.expectedMonthlyOrders) || 0,
          }),
        })
      );
      setNotice(`Application received. Reference: ${result.applicationId}.`);
      setForm(initialForm);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not submit application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5fbff] px-5 py-8 text-[#111827]">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-lg border border-[#cdeffd] bg-white p-6 shadow-[0_16px_42px_rgba(15,80,130,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a5f]">
            Seller onboarding
          </p>
          <h1 className="mt-2 text-4xl font-black">Join the Esxcrowise pilot</h1>
          <p className="mt-3 font-semibold text-[#536275]">
            This form collects the basic seller details Esxcrowise needs before approving a
            business to receive protected WhatsApp payment links.
          </p>
          <div className="mt-6 grid gap-3">
            <Step title="Identity" text="Business, owner, phone, location, and social handle." />
            <Step title="Bank match" text="Bank name and account name for settlement review." />
            <Step title="Pilot fit" text="Category, order volume, and notes for admin approval." />
          </div>
          <div className="mt-6 rounded-lg bg-[#effaff] p-4 text-sm font-bold text-[#536275]">
            {notice}
          </div>
        </aside>

        <form
          className="rounded-lg border border-[#cdeffd] bg-white p-5 shadow-[0_16px_42px_rgba(15,80,130,0.08)]"
          onSubmit={submitApplication}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Business name" value={form.businessName} onChange={(value) => updateForm("businessName", value)} required />
            <Input label="Owner name" value={form.ownerName} onChange={(value) => updateForm("ownerName", value)} required />
            <Input label="WhatsApp phone" value={form.phone} onChange={(value) => updateForm("phone", value)} required />
            <Input label="Email" value={form.email} onChange={(value) => updateForm("email", value)} required />
            <Select label="Category" value={form.category} onChange={(value) => updateForm("category", value)} options={["Fashion", "Gadgets", "Hair and wigs", "Perfume", "Furniture", "Other"]} />
            <Input label="Location" value={form.location} onChange={(value) => updateForm("location", value)} required />
            <Input label="Instagram / TikTok / Website" value={form.socialHandle} onChange={(value) => updateForm("socialHandle", value)} />
            <Input label="Bank name" value={form.bankName} onChange={(value) => updateForm("bankName", value)} />
            <Input label="Bank account name" value={form.bankAccountName} onChange={(value) => updateForm("bankAccountName", value)} />
            <Select label="Verification ID" value={form.verificationIdType} onChange={(value) => updateForm("verificationIdType", value)} options={["NIN", "BVN", "CAC", "International passport", "Driver licence"]} />
            <Input label="Expected monthly orders" value={form.expectedMonthlyOrders} onChange={(value) => updateForm("expectedMonthlyOrders", value.replace(/\D/g, ""))} inputMode="numeric" />
            <Input label="Notes" value={form.notes} onChange={(value) => updateForm("notes", value)} />
          </div>
          <button className="primary mt-5" disabled={saving}>
            {saving ? "Submitting..." : "Submit seller application"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Step({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-[#effaff] p-4">
      <strong>{title}</strong>
      <p className="mt-1 text-sm font-semibold text-[#536275]">{text}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  inputMode,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric";
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
