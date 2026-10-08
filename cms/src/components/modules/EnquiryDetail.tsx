"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button, buttonClass } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Form";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useConfirm } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, formatDate, useResource, useUnsavedChanges } from "@/lib/hooks";
import type { Enquiry, EnquiryStatus } from "@/lib/types";

import { ENQUIRY_STATUS_LABELS, ENQUIRY_TYPE_LABELS, EnquiryStatusBadge } from "./enquiryLabels";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useResource<Enquiry>(`/enquiries/${id}`);
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  return <EnquiryView key={data.id} enquiry={data} />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{children || "—"}</dd>
    </div>
  );
}

function EnquiryView({ enquiry }: { enquiry: Enquiry }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [current, setCurrent] = useState(enquiry);
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [notes, setNotes] = useState(enquiry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = status !== current.status || notes !== (current.notes ?? "");
  useUnsavedChanges(dirty);

  const subject = `Re: your ${ENQUIRY_TYPE_LABELS[current.type].toLowerCase()} — Fortune Decor`;
  const replyHref = `mailto:${current.email}?subject=${encodeURIComponent(subject)}`;

  async function save() {
    setSaving(true);
    try {
      const updated = await adminFetch<Enquiry>(`/enquiries/${current.id}`, { method: "PATCH", body: JSON.stringify({ status, notes }) });
      setCurrent(updated);
      toast.success("Enquiry updated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: "Delete enquiry?",
      message: `The enquiry from ${current.name} will be permanently deleted.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch(`/enquiries/${current.id}`, { method: "DELETE" });
      toast.success("Enquiry deleted");
      router.push("/enquiries");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title={current.name}
        description={
          <span className="inline-flex items-center gap-2">
            {ENQUIRY_TYPE_LABELS[current.type]} · {formatDate(current.created_at)} <EnquiryStatusBadge status={current.status} />
          </span>
        }
        back={{ href: "/enquiries", label: "Enquiries" }}
        actions={
          <>
            <a href={replyHref} className={buttonClass("secondary")}>
              Reply by email
            </a>
            {current.phone && (
              <a href={`tel:${current.phone.replace(/\s/g, "")}`} className={buttonClass("secondary")}>
                Call
              </a>
            )}
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Panel title="Message">
            <p className="whitespace-pre-wrap text-[15px]">{current.message || <span className="text-muted">No message.</span>}</p>
          </Panel>
          <Panel title="Details">
            <dl className="divide-y divide-line text-sm">
              <Row label="Email">
                <a href={`mailto:${current.email}`} className="text-brand hover:underline">
                  {current.email}
                </a>
              </Row>
              <Row label="Phone">{current.phone}</Row>
              <Row label="Company">{current.company}</Row>
              <Row label="City">{current.city}</Row>
              <Row label="Category">{current.category_name}</Row>
              <Row label="Product">{current.product_name}</Row>
              <Row label="Sent from">
                {/* Visitor-supplied: only link plain site paths, never anything that could change the host */}
                {current.source_page && /^\/(?!\/)[\w\-./#?=&%]*$/.test(current.source_page) ? (
                  <a href={`${SITE_URL}${current.source_page}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    {current.source_page}
                  </a>
                ) : (
                  current.source_page
                )}
              </Row>
              <Row label="IP address">{current.ip_address}</Row>
            </dl>
          </Panel>
        </div>

        <Panel title="Follow-up" description="Only visible to your team.">
          <div className="space-y-4">
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as EnquiryStatus)}>
                {Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Internal notes">
              <Textarea rows={8} value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} placeholder="Called back on…, sent samples…" />
            </Field>
            <Button onClick={save} loading={saving} disabled={!dirty} className="w-full">
              Save
            </Button>
            <p className="text-xs text-muted">Last updated {formatDate(current.updated_at)}</p>
          </div>
        </Panel>
      </div>
    </>
  );
}
