import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import type { SearchResult } from "@/lib/types";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const API = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const KIND_LABELS: Record<SearchResult["kind"], string> = {
  category: "Collection",
  product: "Product",
  faq: "FAQ",
  page: "Page",
};

async function search(q: string): Promise<SearchResult[]> {
  // Uncached: results depend on the query and should reflect the latest CMS content
  const res = await fetch(`${API}/search?${new URLSearchParams({ q })}`, { cache: "no-store" });
  return res.ok ? res.json() : [];
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const results = q.length >= 2 ? await search(q) : [];

  return (
    <>
      <form action="/search" role="search" className="mt-8 flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          required
          minLength={2}
          aria-label="Search the site"
          placeholder="Search curtains, blinds, wallpapers, FAQs…"
          className="min-w-0 flex-1 rounded-pill border border-ink px-5 py-2.5 font-alt text-base outline-none focus:border-brand"
        />
        <button type="submit" className="rounded-pill bg-brand px-6 py-2.5 text-sm text-white hover:bg-brand-strong">
          Search
        </button>
      </form>

      {q.length >= 2 && (
        <p className="mt-6 text-muted" role="status">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {results.map((r) => (
          <li key={`${r.kind}-${r.url}-${r.title}`}>
            <Link href={r.url} className="block rounded-card border border-line bg-white p-5 transition-colors hover:border-brand">
              <span className="text-xs font-semibold tracking-wider text-brand uppercase">{KIND_LABELS[r.kind]}</span>
              <h2 className="mt-1 font-display text-lg font-semibold">{r.title}</h2>
              {r.snippet && <p className="mt-1.5 font-alt text-sm text-ink-soft">{r.snippet}</p>}
            </Link>
          </li>
        ))}
      </ul>

      {q.length >= 2 && results.length === 0 && (
        <p className="mt-4 font-alt text-body-lg">
          Nothing matched. Try another word, or <Link href="/contact" className="text-brand underline">ask our team</Link>.
        </p>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="container-site section-y max-w-3xl">
      <h1 className="text-section font-semibold text-brand">Search</h1>
      <Suspense fallback={<p className="mt-8 text-muted">Searching…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
