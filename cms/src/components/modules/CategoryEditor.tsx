"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { GalleryField } from "@/components/media/GalleryField";
import { ImageField } from "@/components/media/ImageField";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, orNull, Textarea, Toggle } from "@/components/ui/Form";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useConfirm } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource, useUnsavedChanges } from "@/lib/hooks";
import type { Category } from "@/lib/types";

import { SeoPanel } from "./SeoPanel";

type Draft = Omit<Category, "id" | "sequence" | "product_count" | "created_at" | "updated_at">;

const EMPTY: Draft = {
  name: "",
  slug: "",
  tagline: null,
  description: null,
  intro_title: null,
  intro_text: null,
  types_heading: null,
  card_image: null,
  hero_image: null,
  types_image: null,
  gallery: [],
  is_active: true,
  meta_title: null,
  meta_description: null,
  og_image: null,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function CategoryEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const { data, error, loading, reload } = useResource<Category>(isNew ? null : `/categories/${id}`);

  if (!isNew && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && (loading || !data)) return <Loading />;
  // key resets the form when switching between categories
  return <CategoryForm key={data?.id ?? "new"} initial={data} />;
}

function CategoryForm({ initial }: { initial: Category | null }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<Draft>(initial ?? EMPTY);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedChanges(dirty);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  async function save() {
    if (!draft.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const body = JSON.stringify({ ...draft, slug: draft.slug.trim() || null });
      const saved = initial
        ? await adminFetch<Category>(`/categories/${initial.id}`, { method: "PATCH", body })
        : await adminFetch<Category>("/categories", { method: "POST", body });
      setDirty(false);
      setDraft(saved);
      toast.success(initial ? "Category saved — the website updates within seconds" : "Category created");
      if (!initial) router.replace(`/categories/${saved.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    const ok = await confirm({
      title: "Delete category?",
      message: (
        <>
          <strong>{initial.name}</strong> will be removed from the website. Categories that still contain products can’t be deleted.
        </>
      ),
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch(`/categories/${initial.id}`, { method: "DELETE" });
      setDirty(false);
      toast.success("Category deleted");
      router.push("/categories");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <PageHeader
        title={initial ? initial.name : "New category"}
        back={{ href: "/categories", label: "Categories" }}
        actions={
          <>
            {initial && (
              <a href={`${SITE_URL}/products/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-brand">
                View on site ↗
              </a>
            )}
            {initial && (
              <Button variant="danger" onClick={remove}>
                Delete
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={!dirty && !!initial}>
              {initial ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name *">
                <Input value={draft.name} maxLength={120} required onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="URL slug" hint={`Website address: /products/${draft.slug || "…"} · leave empty to generate from the name`}>
                <Input
                  value={draft.slug}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase letters, numbers and hyphens"
                  onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
                />
              </Field>
              <Field label="Page subtitle" className="md:col-span-2" hint="Grey line under the title on the category page">
                <Textarea rows={2} value={draft.description ?? ""} onChange={(e) => set({ description: orNull(e.target.value) })} />
              </Field>
              <Field label="Types page subtitle" className="md:col-span-2" hint="Grey line on the “all types” page">
                <Textarea rows={2} value={draft.tagline ?? ""} maxLength={255} onChange={(e) => set({ tagline: orNull(e.target.value) })} />
              </Field>
            </div>
          </Panel>

          <Panel title="Intro block" description="Big heading, text and enquiry buttons at the top of the category page.">
            <div className="space-y-4">
              <Field label="Heading">
                <Input value={draft.intro_title ?? ""} maxLength={200} placeholder="Designed for Modern Projects" onChange={(e) => set({ intro_title: orNull(e.target.value) })} />
              </Field>
              <Field label="Text">
                <Textarea rows={3} value={draft.intro_text ?? ""} onChange={(e) => set({ intro_text: orNull(e.target.value) })} />
              </Field>
              <Field label="Types list heading" hint="Shown above the numbered list of products">
                <Input value={draft.types_heading ?? ""} maxLength={120} placeholder="Curtain Types" onChange={(e) => set({ types_heading: orNull(e.target.value) })} />
              </Field>
            </div>
          </Panel>

          <Panel title="Gallery">
            <GalleryField label="Gallery media (images & videos)" hint="Shown in a row of three below the types list." value={draft.gallery} onChange={(gallery) => set({ gallery })} />
          </Panel>

          <SeoPanel value={draft} onChange={set} fallbackTitle={draft.name || "Category name"} />
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <Toggle checked={draft.is_active} onChange={(is_active) => set({ is_active })} label={draft.is_active ? "Visible on website" : "Hidden from website"} />
          </Panel>
          <Panel title="Media">
            <div className="space-y-5">
              <ImageField label="Card media" hint="Used in product grids and menus" value={draft.card_image} onChange={(card_image) => set({ card_image })} />
              <ImageField label="Intro media" hint="Beside the intro block" value={draft.hero_image} onChange={(hero_image) => set({ hero_image })} aspect="aspect-square" />
              <ImageField label="Types media" hint="Beside the types list" value={draft.types_image} onChange={(types_image) => set({ types_image })} aspect="aspect-square" />
            </div>
          </Panel>
          {initial && (
            <LinkButton href={`/products?category=${initial.id}`} variant="secondary" className="w-full">
              Manage {initial.product_count} product{initial.product_count === 1 ? "" : "s"}
            </LinkButton>
          )}
        </div>
      </div>
    </form>
  );
}
