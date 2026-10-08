"use client";

import { useState } from "react";

import { ImageField } from "@/components/media/ImageField";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource, useUnsavedChanges } from "@/lib/hooks";
import type { Settings } from "@/lib/types";

type FieldDef = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "image" | "url" | "email" | "tel";
  hint?: string;
  placeholder?: string;
  validate?: (v: string) => string | null;
};

const httpsUrl = (v: string) => (!v || /^https:\/\/[^\s]+$/.test(v) ? null : "Must be a full https:// link");

const GROUPS: { key: keyof Settings; title: string; description: string; fields: FieldDef[] }[] = [
  {
    key: "brand",
    title: "Brand",
    description: "Logo and tagline used in the header and footer.",
    fields: [
      { key: "name", label: "Business name" },
      { key: "logo", label: "Logo", kind: "image" },
      { key: "tagline", label: "Footer tagline", placeholder: "Designed for Every Surface." },
      { key: "description", label: "Footer description", kind: "textarea" },
    ],
  },
  {
    key: "contact",
    title: "Contact details",
    description: "Shown in the footer, the Get In Touch card and the Contact page.",
    fields: [
      { key: "email", label: "Email", kind: "email" },
      { key: "phone", label: "Phone", kind: "tel", placeholder: "+91 98765 43210" },
      { key: "whatsapp", label: "WhatsApp number", kind: "tel" },
      { key: "address", label: "Office address", kind: "textarea" },
      { key: "location", label: "Short location", placeholder: "Gujarat, India" },
      { key: "hours", label: "Working hours", placeholder: "Mon – Sat, 10:00 – 19:00" },
      {
        key: "map_embed_url",
        label: "Google Maps embed link",
        kind: "url",
        hint: "Google Maps → Share → Embed a map → copy only the src=\"…\" link. Leave empty to show the map image.",
        validate: (v) => (!v || v.startsWith("https://www.google.com/maps/embed") ? null : "Must start with https://www.google.com/maps/embed"),
      },
    ],
  },
  {
    key: "socials",
    title: "Social media",
    description: "Icons only appear for networks with a link.",
    fields: [
      { key: "instagram", label: "Instagram", kind: "url", placeholder: "https://instagram.com/…", validate: httpsUrl },
      { key: "facebook", label: "Facebook", kind: "url", placeholder: "https://facebook.com/…", validate: httpsUrl },
      { key: "linkedin", label: "LinkedIn", kind: "url", placeholder: "https://linkedin.com/company/…", validate: httpsUrl },
      { key: "youtube", label: "YouTube", kind: "url", placeholder: "https://youtube.com/@…", validate: httpsUrl },
    ],
  },
  {
    key: "footer",
    title: "Footer",
    description: "Bottom bar text and the footer button.",
    fields: [
      { key: "copyright", label: "Copyright line" },
      { key: "cta_label", label: "Button text" },
      { key: "cta_href", label: "Button link", placeholder: "/contact" },
    ],
  },
  {
    key: "seo",
    title: "Search engines",
    description: "Defaults for pages without their own title and description.",
    fields: [
      { key: "default_title", label: "Default page title" },
      { key: "default_description", label: "Default description", kind: "textarea", hint: "Ideally 120–160 characters." },
      { key: "og_image", label: "Default share image", kind: "image" },
    ],
  },
];

export default function SettingsPage() {
  const { data, error, loading, reload } = useResource<Settings>("/settings");
  return (
    <>
      <PageHeader title="Settings" description="Site-wide details. Each group saves separately." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="grid gap-6 xl:grid-cols-2">
          {GROUPS.map((g) => (
            <SettingsGroup key={g.key} group={g} initial={data[g.key] ?? {}} />
          ))}
        </div>
      )}
    </>
  );
}

function SettingsGroup({ group, initial }: { group: (typeof GROUPS)[number]; initial: Record<string, string> }) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const errors = Object.fromEntries(group.fields.map((f) => [f.key, f.validate?.(values[f.key] ?? "") ?? null]));
  const invalid = Object.values(errors).some(Boolean);
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const updated = await adminFetch<Record<string, string>>(`/settings/${group.key}`, { method: "PUT", body: JSON.stringify({ value: values }) });
      setSaved(updated);
      setValues(updated);
      toast.success(`${group.title} saved`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title={group.title}
      description={group.description}
      actions={
        <Button size="sm" onClick={save} loading={saving} disabled={!dirty || invalid}>
          Save
        </Button>
      }
    >
      <div className="space-y-4">
        {group.fields.map((f) => {
          const value = values[f.key] ?? "";
          if (f.kind === "image") return <ImageField key={f.key} label={f.label} value={value || null} onChange={(url) => set(f.key, url ?? "")} />;
          return (
            <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]}>
              {f.kind === "textarea" ? (
                <Textarea rows={3} value={value} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <Input
                  type={f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : f.kind === "url" ? "url" : "text"}
                  value={value}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value.trimStart())}
                />
              )}
            </Field>
          );
        })}
      </div>
    </Panel>
  );
}
