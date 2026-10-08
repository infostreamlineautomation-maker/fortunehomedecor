"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Form";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, formatDate, useResource, useUnsavedChanges } from "@/lib/hooks";
import type { JsonObject, PageSection } from "@/lib/types";

import { DesignLedEditor } from "./DesignLedEditor";
import { HeroSectionEditor } from "./HeroSectionEditor";
import { JsonContentEditor } from "./JsonContentEditor";

const PAGE_META: Record<string, { title: string; path: string }> = {
  home: { title: "Home", path: "/" },
  products: { title: "Our Products", path: "/products" },
  about: { title: "About Us", path: "/about" },
  contact: { title: "Contact Us", path: "/contact" },
};
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function PageEditor() {
  const { page } = useParams<{ page: string }>();
  const meta = PAGE_META[page] ?? { title: page, path: "/" };
  const { data, error, loading, reload } = useResource<PageSection[]>(`/pages/${page}`);
  const [dirtySections, setDirtySections] = useState<Set<number>>(new Set());
  useUnsavedChanges(dirtySections.size > 0);

  const markDirty = (id: number, dirty: boolean) =>
    setDirtySections((s) => {
      const next = new Set(s);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <>
      <PageHeader
        title={meta.title}
        description="Each section saves separately. Changes appear on the website within seconds."
        back={{ href: "/pages", label: "Pages" }}
        actions={
          <a href={`${SITE_URL}${meta.path}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-brand">
            View page ↗
          </a>
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      <div className="space-y-6">
        {data?.map((section) => (
          <SectionForm key={section.id} section={section} onDirtyChange={(d) => markDirty(section.id, d)} />
        ))}
      </div>
    </>
  );
}

function SectionForm({ section, onDirtyChange }: { section: PageSection; onDirtyChange: (dirty: boolean) => void }) {
  const toast = useToast();
  const [saved, setSaved] = useState(section);
  const [content, setContent] = useState<JsonObject>(section.content);
  const [isActive, setIsActive] = useState(section.is_active);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(content) !== JSON.stringify(saved.content) || isActive !== saved.is_active;

  const change = (next: JsonObject) => {
    setContent(next);
    onDirtyChange(true);
  };

  async function save() {
    setSaving(true);
    try {
      const updated = await adminFetch<PageSection>(`/pages/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content, is_active: isActive }),
      });
      setSaved(updated);
      setContent(updated.content);
      onDirtyChange(false);
      toast.success(`${section.label} saved`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title={section.label}
      description={`Last edited ${formatDate(saved.updated_at)}`}
      actions={
        <div className="flex items-center gap-4">
          <Toggle
            checked={isActive}
            onChange={(v) => {
              setIsActive(v);
              onDirtyChange(true);
            }}
            label={isActive ? "Shown" : "Hidden"}
          />
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
            Save
          </Button>
        </div>
      }
    >
      {section.key === "hero" ? (
        <HeroSectionEditor value={content} onChange={change} />
      ) : section.page === "about" && section.key === "design_led" ? (
        <DesignLedEditor value={content} onChange={change} />
      ) : (
        <JsonContentEditor value={content} onChange={change} />
      )}
      {dirty && (
        <div className="mt-5 flex justify-end gap-3 border-t border-line pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setContent(saved.content);
              setIsActive(saved.is_active);
              onDirtyChange(false);
            }}
          >
            Discard changes
          </Button>
          <Button onClick={save} loading={saving}>
            Save {section.label}
          </Button>
        </div>
      )}
    </Panel>
  );
}
