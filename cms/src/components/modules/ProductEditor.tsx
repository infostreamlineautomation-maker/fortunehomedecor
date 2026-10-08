"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { GalleryField } from "@/components/media/GalleryField";
import { ImageField } from "@/components/media/ImageField";
import { Button } from "@/components/ui/Button";
import { Field, Input, orNull, Select, Textarea, Toggle } from "@/components/ui/Form";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/ui/Layout";
import { useConfirm } from "@/components/ui/Modal";
import { TagInput } from "@/components/ui/TagInput";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource, useUnsavedChanges } from "@/lib/hooks";
import type { Category, Product } from "@/lib/types";

import { SeoPanel } from "./SeoPanel";

type Draft = Omit<Product, "id" | "sequence" | "category_name" | "created_at" | "updated_at" | "category_id"> & { category_id: number | "" };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const presetCategory = useSearchParams().get("category");
  const product = useResource<Product>(isNew ? null : `/products/${id}`);
  const categories = useResource<Category[]>("/categories");

  if (product.error) return <ErrorBox message={product.error} onRetry={product.reload} />;
  if (categories.error) return <ErrorBox message={categories.error} onRetry={categories.reload} />;
  if ((!isNew && !product.data) || !categories.data) return <Loading />;

  return (
    <ProductForm
      key={product.data?.id ?? "new"}
      initial={product.data}
      categories={categories.data}
      presetCategory={presetCategory ? Number(presetCategory) : null}
    />
  );
}

function ProductForm({ initial, categories, presetCategory }: { initial: Product | null; categories: Category[]; presetCategory: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<Draft>(
    initial ?? {
      category_id: presetCategory ?? categories[0]?.id ?? "",
      name: "",
      slug: "",
      short_description: null,
      description: null,
      suitable_for: [],
      cover_image: null,
      images: [],
      is_active: true,
      meta_title: null,
      meta_description: null,
      og_image: null,
    },
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useUnsavedChanges(dirty);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const category = categories.find((c) => c.id === draft.category_id);

  async function save() {
    if (!draft.name.trim()) return toast.error("Name is required");
    if (!draft.category_id) return toast.error("Choose a category");
    setSaving(true);
    try {
      const body = JSON.stringify({ ...draft, slug: draft.slug.trim() || null });
      const saved = initial
        ? await adminFetch<Product>(`/products/${initial.id}`, { method: "PATCH", body })
        : await adminFetch<Product>("/products", { method: "POST", body });
      setDirty(false);
      setDraft(saved);
      toast.success(initial ? "Product saved — the website updates within seconds" : "Product created");
      if (!initial) router.replace(`/products/${saved.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    const ok = await confirm({
      title: "Delete product?",
      message: (
        <>
          <strong>{initial.name}</strong> will be removed from the website. Its enquiries are kept.
        </>
      ),
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch(`/products/${initial.id}`, { method: "DELETE" });
      setDirty(false);
      toast.success("Product deleted");
      router.push(`/products?category=${initial.category_id}`);
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
        title={initial ? initial.name : "New product"}
        back={{ href: `/products${draft.category_id ? `?category=${draft.category_id}` : ""}`, label: "Products" }}
        actions={
          <>
            {initial && category && (
              <a
                href={`${SITE_URL}/products/${category.slug}/types#${initial.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted hover:text-brand"
              >
                View on site ↗
              </a>
            )}
            {initial && (
              <Button variant="danger" onClick={remove}>
                Delete
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={!dirty && !!initial}>
              {initial ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name *">
                <Input value={draft.name} maxLength={160} required placeholder="Sheer Curtains" onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Category *">
                <Select value={draft.category_id} onChange={(e) => set({ category_id: Number(e.target.value) })} required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="URL slug" className="md:col-span-2" hint="Leave empty to generate from the name">
                <Input
                  value={draft.slug}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase letters, numbers and hyphens"
                  onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Content">
            <div className="space-y-4">
              <Field label="Description" hint="Main text in the product block">
                <Textarea rows={4} value={draft.description ?? ""} onChange={(e) => set({ description: orNull(e.target.value) })} />
              </Field>
              <Field label="Short description" hint="One line used in search results and listings">
                <Input value={draft.short_description ?? ""} maxLength={500} onChange={(e) => set({ short_description: orNull(e.target.value) })} />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium">Suitable for</p>
                <TagInput value={draft.suitable_for} onChange={(suitable_for) => set({ suitable_for })} placeholder="e.g. Hospitality, Bedrooms…" />
              </div>
            </div>
          </Panel>

          <Panel title="Product media">
            <GalleryField label="Additional media (images & videos)" hint="Shown in the interactive media gallery on the product page" value={draft.images} onChange={(images) => set({ images })} />
          </Panel>

          <SeoPanel value={draft} onChange={set} fallbackTitle={draft.name || "Product name"} />
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <Toggle checked={draft.is_active} onChange={(is_active) => set({ is_active })} label={draft.is_active ? "Visible on website" : "Hidden from website"} />
          </Panel>
          <Panel title="Main media">
            <ImageField label="Cover image / video" hint="Main media shown beside the product text" value={draft.cover_image} onChange={(cover_image) => set({ cover_image })} aspect="aspect-square" />
          </Panel>
        </div>
      </div>
    </form>
  );
}
