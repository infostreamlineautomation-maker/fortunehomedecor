"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";

export default function LoginPage() {
  const { admin, login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (admin) router.replace("/");
  }, [admin, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      const badCredentials = err instanceof ApiError && (err.status === 401 || err.status === 422);
      setError(badCredentials ? "Invalid email or password." : "Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand p-10 text-white lg:flex">
        <Image
          src={mediaUrl("/uploads/figma/brand/logo.png")}
          alt="Fortune Decor"
          width={220}
          height={74}
          style={{ height: "auto" }}
          preload
        />
        <div>
          <p className="font-display text-4xl font-bold leading-tight">Designed for Every Surface.</p>
          <p className="mt-3 max-w-md text-base text-white/85">Content manager for the Fortune Decor website.</p>
        </div>
        <p className="font-serif-alt text-sm text-white/70">© 2026 Fortune Decor</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm rounded-media bg-ink-soft p-7 text-white md:p-8">
          <h1 className="font-display text-3xl font-medium text-brand-soft">Sign in</h1>
          <p className="mt-2 font-alt text-sm text-line">Use your CMS account to continue.</p>

          <label className="mt-6 block font-display text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1.5 w-full rounded-card border border-glass-line bg-glass px-3.5 py-2.5 text-sm outline-none focus:border-brand-soft"
          />

          <label className="mt-5 block font-display text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-card border border-glass-line bg-glass px-3.5 py-2.5 text-sm outline-none focus:border-brand-soft"
          />

          {error && (
            <p role="alert" className="mt-4 rounded-card bg-brand/20 px-4 py-2 text-sm text-white">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full rounded-pill bg-brand py-2.5 text-base transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
