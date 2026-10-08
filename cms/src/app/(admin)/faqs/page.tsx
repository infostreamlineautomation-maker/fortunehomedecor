"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/Form";
import { Badge, EmptyState, ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useConfirm } from "@/components/ui/Modal";
import { SortableList } from "@/components/ui/SortableList";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource } from "@/lib/hooks";
import type { Category, Faq } from "@/lib/types";

type Scope = "global" | number;

export default function FaqsPage() {
  const [scope, setScope] = useState<Scope>("global");
  const categories = useResource<Category[]>("/categories");
  const path = scope === "global" ? "/faqs?global_only=true" : `/faqs?category_id=${scope}`;
  const { data, setData, error, loading, reload } = useResource<Faq[]>(path);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const scopeName = scope === "global" ? "Home, About & Contact" : (categories.data?.find((c) => c.id === scope)?.name ?? "");

  async function reorder(items: Faq[]) {
    const previous = data;
    setData(items);
    try {
      const qs = scope === "global" ? "" : `?category_id=${scope}`;
      await adminFetch(`/faqs/reorder${qs}`, { method: "PUT", body: JSON.stringify({ ids: items.map((f) => f.id) }) });
      toast.success("Order saved");
    } catch (e) {
      setData(previous);
      toast.error(errorMessage(e));
    }
  }

  async function remove(faq: Faq) {
    const ok = await confirm({ title: "Delete FAQ?", message: <strong>{faq.question}</strong>, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await adminFetch(`/faqs/${faq.id}`, { method: "DELETE" });
      setData((list) => list?.filter((f) => f.id !== faq.id) ?? null);
      toast.success("FAQ deleted");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const onSaved = (faq: Faq, created: boolean) => {
    setData((list) => (created ? [...(list ?? []), faq] : (list?.map((f) => (f.id === faq.id ? faq : f)) ?? null)));
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions shown in the FAQ block. Category FAQs replace the general ones on that category's pages."
        actions={
          <Button onClick={() => setEditing("new")} disabled={editing === "new"}>
            New FAQ
          </Button>
        }
      />

      <div role="tablist" aria-label="FAQ group" className="mb-5 flex flex-wrap gap-2">
        {(["global", ...(categories.data?.map((c) => c.id) ?? [])] as Scope[]).map((s) => {
          const label = s === "global" ? "General" : categories.data?.find((c) => c.id === s)?.name;
          return (
            <button
              key={s}
              role="tab"
              aria-selected={scope === s}
              onClick={() => {
                setScope(s);
                setEditing(null);
              }}
              className={`rounded-pill border px-4 py-1.5 text-sm transition-colors ${scope === s ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {editing === "new" && (
        <Panel title={`New FAQ · ${scopeName}`} className="mb-5">
          <FaqForm categoryId={scope === "global" ? null : scope} onCancel={() => setEditing(null)} onSaved={(f) => onSaved(f, true)} />
        </Panel>
      )}

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.length === 0 && editing !== "new" && (
        <EmptyState title="No FAQs here yet">{scope === "global" ? "Add questions for the Home, About and Contact pages." : "This category shows the general FAQs until you add its own."}</EmptyState>
      )}
      {data && data.length > 0 && (
        <SortableList
          items={data}
          getKey={(f) => f.id}
          onReorder={reorder}
          disabled={editing !== null}
          renderItem={(faq, i) =>
            editing === faq.id ? (
              <FaqForm faq={faq} categoryId={faq.category_id} onCancel={() => setEditing(null)} onSaved={(f) => onSaved(f, false)} />
            ) : (
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {i + 1}. {faq.question}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{faq.answer}</p>
                </div>
                {!faq.is_active && <Badge>Hidden</Badge>}
                <Button size="sm" variant="secondary" onClick={() => setEditing(faq.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(faq)}>
                  Delete
                </Button>
              </div>
            )
          }
        />
      )}
    </>
  );
}

function FaqForm({ faq, categoryId, onCancel, onSaved }: { faq?: Faq; categoryId: number | null; onCancel: () => void; onSaved: (faq: Faq) => void }) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [isActive, setIsActive] = useState(faq?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (question.trim().length < 3 || !answer.trim()) return toast.error("Enter a question and an answer");
    setSaving(true);
    try {
      const body = JSON.stringify({ question: question.trim(), answer: answer.trim(), is_active: isActive, category_id: categoryId });
      const saved = faq
        ? await adminFetch<Faq>(`/faqs/${faq.id}`, { method: "PATCH", body })
        : await adminFetch<Faq>("/faqs", { method: "POST", body });
      toast.success(faq ? "FAQ saved" : "FAQ added");
      onSaved(saved);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Question">
        <Input value={question} maxLength={300} onChange={(e) => setQuestion(e.target.value)} autoFocus />
      </Field>
      <Field label="Answer">
        <Textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Toggle checked={isActive} onChange={setIsActive} label={isActive ? "Shown on website" : "Hidden"} />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {faq ? "Save" : "Add FAQ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
