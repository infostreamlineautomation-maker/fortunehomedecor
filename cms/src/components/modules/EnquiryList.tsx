"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { buttonClass } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { EmptyState, ErrorBox, Loading, PageHeader, Pagination } from "@/components/ui/Layout";
import { ADMIN_API_URL } from "@/lib/api";
import { formatDate, useResource } from "@/lib/hooks";
import type { Enquiry, Page } from "@/lib/types";

import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS, EnquiryStatusBadge } from "./enquiryLabels";

const FILTER_KEYS = ["type", "status", "q", "date_from", "date_to"] as const;

export function EnquiryList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const page = Number(params.get("page") ?? 1);

  const filters = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = params.get(k);
    if (v) filters.set(k, v);
  }
  const listQuery = new URLSearchParams(filters);
  listQuery.set("page", String(page));
  listQuery.set("page_size", "25");
  const { data, error, loading, reload } = useResource<Page<Enquiry>>(`/enquiries?${listQuery}`);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next}`);
  };

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Contact messages, quote and sample requests from the website."
        actions={
          // Plain link: the browser sends the session cookie and downloads the file
          <a href={`${ADMIN_API_URL}/enquiries/export.csv?${filters}`} className={buttonClass("secondary")}>
            Export CSV
          </a>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_2fr_1fr_1fr]">
        <Select value={params.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {Object.entries(ENQUIRY_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={params.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim());
          }}
        >
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone or company" aria-label="Search enquiries" />
        </form>
        <Input type="date" value={params.get("date_from") ?? ""} onChange={(e) => setParam("date_from", e.target.value)} aria-label="From date" />
        <Input type="date" value={params.get("date_to") ?? ""} onChange={(e) => setParam("date_to", e.target.value)} aria-label="To date" />
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.items.length === 0 && <EmptyState title="No enquiries match">{filters.size ? "Try clearing the filters." : "New website enquiries will appear here."}</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-cream text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">About</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((e) => (
                <tr key={e.id} className={`hover:bg-cream ${e.status === "new" ? "font-medium" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/enquiries/${e.id}`} className="hover:text-brand">
                      {e.name}
                      <span className="block text-xs font-normal text-muted">{e.email}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{ENQUIRY_TYPE_LABELS[e.type]}</td>
                  <td className="px-4 py-3 text-muted">{e.product_name || e.category_name || "—"}</td>
                  <td className="px-4 py-3">
                    <EnquiryStatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={(p) => setParam("page", String(p))} />}
    </>
  );
}
