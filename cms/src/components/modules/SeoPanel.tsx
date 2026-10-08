"use client";

import { ImageField } from "@/components/media/ImageField";
import { Field, Input, orNull, Textarea } from "@/components/ui/Form";
import { Panel } from "@/components/ui/Layout";

type Seo = { meta_title: string | null; meta_description: string | null; og_image: string | null };

/** Search engine & social sharing fields, shared by categories and products. */
export function SeoPanel<T extends Seo>({ value, onChange, fallbackTitle }: { value: T; onChange: (patch: Partial<Seo>) => void; fallbackTitle: string }) {
  const title = value.meta_title ?? "";
  const description = value.meta_description ?? "";
  return (
    <Panel title="Search & sharing" description="Optional. Leave empty to use the name and description.">
      <div className="space-y-4">
        <Field label="Page title" hint={`${title.length}/160 · default: “${fallbackTitle}”`}>
          <Input value={title} maxLength={160} onChange={(e) => onChange({ meta_title: orNull(e.target.value) })} />
        </Field>
        <Field label="Meta description" hint={`${description.length}/320 · ideally 120–160 characters`}>
          <Textarea rows={3} value={description} maxLength={320} onChange={(e) => onChange({ meta_description: orNull(e.target.value) })} />
        </Field>
        <ImageField label="Social share image" value={value.og_image} onChange={(og_image) => onChange({ og_image })} aspect="aspect-[1200/630]" />
      </div>
    </Panel>
  );
}
