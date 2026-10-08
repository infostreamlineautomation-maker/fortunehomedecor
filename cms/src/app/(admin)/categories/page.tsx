"use client";

import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Form";
import { Badge, EmptyState, ErrorBox, Loading, PageHeader } from "@/components/ui/Layout";
import { SortableList } from "@/components/ui/SortableList";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource } from "@/lib/hooks";
import { mediaUrl } from "@/lib/media";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const { data, setData, error, loading, reload } = useResource<Category[]>("/categories");
  const toast = useToast();

  async function reorder(next: Category[]) {
    const previous = data;
    setData(next);
    try {
      await adminFetch("/categories/reorder", { method: "PUT", body: JSON.stringify({ ids: next.map((c) => c.id) }) });
      toast.success("Order saved");
    } catch (e) {
      setData(previous);
      toast.error(errorMessage(e));
    }
  }

  async function setActive(category: Category, is_active: boolean) {
    try {
      const updated = await adminFetch<Category>(`/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
      setData((list) => list?.map((c) => (c.id === updated.id ? updated : c)) ?? null);
      toast.success(`${category.name} is now ${is_active ? "visible" : "hidden"}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Collections shown on the website. Drag to change their order."
        actions={<LinkButton href="/categories/new">New category</LinkButton>}
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.length === 0 && <EmptyState title="No categories yet">Create your first collection, e.g. Curtains.</EmptyState>}
      {data && data.length > 0 && (
        <SortableList
          items={data}
          getKey={(c) => c.id}
          onReorder={reorder}
          renderItem={(c) => (
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-card bg-cream">
                {c.card_image && <Image src={mediaUrl(c.card_image)} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/categories/${c.id}`} className="font-medium hover:text-brand">
                  {c.name}
                </Link>
                <p className="truncate text-sm text-muted">
                  /products/{c.slug} · {c.product_count} product{c.product_count === 1 ? "" : "s"}
                </p>
              </div>
              {!c.is_active && <Badge>Hidden</Badge>}
              <Toggle checked={c.is_active} onChange={(v) => setActive(c, v)} label="Visible" />
              <LinkButton href={`/categories/${c.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
            </div>
          )}
        />
      )}
    </>
  );
}
