"use client";

import { useState } from "react";

import { Select } from "@/components/ui/Form";
import { Badge, EmptyState, ErrorBox, Loading, PageHeader, Pagination } from "@/components/ui/Layout";
import { useAuth } from "@/lib/auth";
import { formatDate, useResource } from "@/lib/hooks";
import type { AuditEntry, Page } from "@/lib/types";

const ENTITIES = ["category", "product", "faq", "page_section", "settings", "media", "enquiry", "user", "auth"];
const ACTION_TONES: Record<string, "green" | "red" | "amber" | "blue" | "grey"> = {
  create: "green",
  upload: "green",
  delete: "red",
  update: "amber",
  reorder: "blue",
  login: "grey",
};

function formatChange(value: unknown): string {
  if (Array.isArray(value) && value.length === 2) return `${JSON.stringify(value[0])} → ${JSON.stringify(value[1])}`;
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default function AuditLogPage() {
  const { admin } = useAuth();
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), page_size: "50" });
  if (entity) qs.set("entity", entity);
  const { data, error, loading, reload } = useResource<Page<AuditEntry>>(admin?.role === "superadmin" ? `/audit-logs?${qs}` : null);

  if (admin?.role !== "superadmin") return <ErrorBox message="Only admins can see the audit log." />;

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every change made in the CMS, newest first."
        actions={
          <Select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by type"
          >
            <option value="">Everything</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {e.replace("_", " ")}
              </option>
            ))}
          </Select>
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.items.length === 0 && <EmptyState title="Nothing logged yet" />}
      {data && data.items.length > 0 && (
        <ul className="divide-y divide-line rounded-card border border-line bg-white">
          {data.items.map((entry) => (
            <li key={entry.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge tone={ACTION_TONES[entry.action] ?? "grey"}>{entry.action}</Badge>
                <span className="font-medium">{entry.summary}</span>
                <span className="ml-auto text-xs text-muted">
                  {entry.admin_email ?? "system"} · {formatDate(entry.created_at)}
                  {entry.ip_address ? ` · ${entry.ip_address}` : ""}
                </span>
              </div>
              {entry.changes && Object.keys(entry.changes).length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-muted hover:text-brand">Show changes</summary>
                  <dl className="mt-2 space-y-1 rounded-card bg-cream p-3 font-mono text-xs">
                    {Object.entries(entry.changes).map(([field, value]) => (
                      <div key={field} className="break-all">
                        <dt className="inline font-semibold">{field}: </dt>
                        <dd className="inline">{formatChange(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />}
    </>
  );
}
