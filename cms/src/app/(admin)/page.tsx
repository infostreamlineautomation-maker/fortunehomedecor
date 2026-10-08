"use client";

import Link from "next/link";

import { EnquiryStatusBadge, ENQUIRY_TYPE_LABELS } from "@/components/modules/enquiryLabels";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useAuth } from "@/lib/auth";
import { formatDate, useResource } from "@/lib/hooks";
import type { Dashboard } from "@/lib/types";

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`rounded-card border p-4 transition-colors hover:border-brand ${highlight ? "border-brand bg-brand-tint" : "border-line bg-white"}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${highlight ? "text-brand" : ""}`}>{value}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { admin } = useAuth();
  const { data, error, loading, reload } = useResource<Dashboard>("/dashboard");

  return (
    <>
      <PageHeader title={`Welcome back${admin?.full_name ? `, ${admin.full_name}` : ""}`} description="Overview of the Fortune Decor website." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="New enquiries" value={data.enquiries_new} href="/enquiries?status=new" highlight={data.enquiries_new > 0} />
            <Stat label="Categories" value={data.categories} href="/categories" />
            <Stat label="Products" value={data.products} href="/products" />
            <Stat label="Images in library" value={data.media} href="/media" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Panel title="Latest enquiries" actions={<Link href="/enquiries" className="text-sm text-brand hover:underline">View all</Link>}>
              {data.latest_enquiries.length === 0 ? (
                <p className="text-sm text-muted">No enquiries yet. They appear here when visitors use the website forms.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {data.latest_enquiries.map((e) => (
                    <li key={e.id}>
                      <Link href={`/enquiries/${e.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-brand">
                        <span>
                          <span className="font-medium">{e.name}</span>
                          <span className="ml-2 text-sm text-muted">{ENQUIRY_TYPE_LABELS[e.type]}</span>
                        </span>
                        <span className="flex items-center gap-3 text-sm text-muted">
                          {formatDate(e.created_at)}
                          <EnquiryStatusBadge status={e.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Enquiries by type">
              <dl className="space-y-2.5 text-sm">
                {(["contact", "quote", "sample"] as const).map((t) => (
                  <div key={t} className="flex justify-between">
                    <dt className="text-muted">{ENQUIRY_TYPE_LABELS[t]}</dt>
                    <dd className="font-semibold">{data.enquiries_by_type[t] ?? 0}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-3">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-semibold">{data.enquiries_total}</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
