"use client";

import Link from "next/link";

import { Badge, ErrorBox, Loading, PageHeader } from "@/components/ui/Layout";
import { formatDate, useResource } from "@/lib/hooks";
import type { PageSection } from "@/lib/types";

const PAGE_NAMES: Record<string, { title: string; path: string }> = {
  home: { title: "Home", path: "/" },
  products: { title: "Our Products", path: "/products" },
  about: { title: "About Us", path: "/about" },
  contact: { title: "Contact Us", path: "/contact" },
};

export default function PagesPage() {
  const { data, error, loading, reload } = useResource<Record<string, PageSection[]>>("/pages");

  return (
    <>
      <PageHeader title="Pages" description="Text and images of the website's fixed pages. Category and product pages are edited under Categories and Products." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <ul className="grid gap-4 md:grid-cols-2">
          {Object.entries(PAGE_NAMES).map(([key, meta]) => {
            const sections = data[key] ?? [];
            const updated = sections.map((s) => s.updated_at).sort().at(-1);
            return (
              <li key={key}>
                <Link href={`/pages/${key}`} className="block h-full rounded-card border border-line bg-white p-5 transition-colors hover:border-brand">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold">{meta.title}</h2>
                    <Badge>{meta.path}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{sections.map((s) => s.label).join(" · ") || "No sections"}</p>
                  <p className="mt-3 text-xs text-muted">Last edited {formatDate(updated)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
