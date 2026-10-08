"use client";

import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type EnquiryType = "contact" | "quote" | "sample";

type Props = {
  type: EnquiryType;
  productSlug?: string;
  categorySlug?: string;
  /** Contact page shows a "Service Required" select built from the categories */
  services?: { slug: string; name: string }[];
  submitLabel?: string;
  /** "dark" = red gradient contact card, "light" = dialog */
  tone?: "dark" | "light";
  onDone?: () => void;
};

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

export function EnquiryForm({ type, productSlug, categorySlug, services, submitLabel = "Send Message", tone = "light", onDone }: Props) {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const dark = tone === "dark";
  const label = `block font-alt text-xs md:text-sm ${dark ? "text-white" : "text-ink"}`;
  const field = `mt-1 w-full rounded-md border px-3 py-2 font-alt text-base outline-none transition-colors md:mt-1.5 md:rounded-card md:px-3.5 md:py-2.5 md:text-[0.9375rem] ${
    dark
      ? "border-[rgb(89_89_89/0.2)] bg-[rgb(206_201_201/0.2)] text-white placeholder:text-white/60 focus:border-white/70"
      : "border-line bg-white text-ink placeholder:text-muted focus:border-brand"
  }`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => (String(data.get(k) ?? "").trim() || undefined);

    setStatus({ state: "sending" });
    try {
      const res = await fetch(`${API_URL}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: value("name"),
          email: value("email"),
          phone: value("phone"),
          company: value("company"),
          city: value("city"),
          message: value("message"),
          category_slug: value("service") ?? categorySlug,
          product_slug: productSlug,
          source_page: pathname,
          website: value("website"),
        }),
      });
      if (res.status === 429) throw new Error("Too many requests — please try again in a minute.");
      if (res.status === 422) throw new Error("Please check your details — the email or phone number looks invalid.");
      if (!res.ok) throw new Error("Something went wrong. Please try again or call us.");
      const body = (await res.json()) as { message: string };
      form.reset();
      setStatus({ state: "sent", message: body.message });
      onDone?.();
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  if (status.state === "sent") {
    return (
      <p role="status" className={`rounded-card p-5 font-alt text-body-lg ${dark ? "bg-white/10 text-white" : "bg-brand-tint text-ink"}`}>
        {status.message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:gap-y-4">
      <label className={label}>
        Full Name
        <input name="name" required minLength={2} maxLength={150} autoComplete="name" placeholder="Enter Your Name*" className={field} />
      </label>
      <label className={label}>
        Phone Number
        <input name="phone" type="tel" maxLength={40} pattern="[0-9+()\-.\s]*" autoComplete="tel" placeholder="Enter Your Phone Number" className={field} />
      </label>
      <label className={label}>
        Email Address
        <input name="email" type="email" required maxLength={255} autoComplete="email" placeholder="Enter Your Email*" className={field} />
      </label>
      {services ? (
        <label className={label}>
          Service Required
          <select name="service" defaultValue="" className={`${field} ${dark ? "[&>option]:text-ink" : ""}`}>
            <option value="">Select a Service</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className={label}>
          City
          <input name="city" maxLength={120} autoComplete="address-level2" placeholder="Your City" className={field} />
        </label>
      )}
      <label className={`${label} sm:col-span-2`}>
        Your Message
        <textarea
          name="message"
          rows={4}
          maxLength={5000}
          placeholder={type === "sample" ? "Which colours or fabrics would you like to see?" : "Tell us about your space, sizes and timeline"}
          className={`${field} resize-y`}
        />
      </label>

      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status.state === "error" && (
        <p role="alert" className={`sm:col-span-2 rounded-card px-3 py-2.5 text-xs md:px-4 md:py-3 md:text-sm ${dark ? "bg-black/30 text-white" : "bg-brand-tint text-brand"}`}>
          {status.message}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status.state === "sending"}
          className="w-full rounded-pill bg-brand-strong px-7 py-2.5 font-alt text-sm text-white transition-colors hover:bg-brand disabled:opacity-60 sm:w-auto md:text-[0.9375rem]"
        >
          {status.state === "sending" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
