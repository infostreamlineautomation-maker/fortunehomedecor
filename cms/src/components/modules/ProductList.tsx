"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { LinkButton } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Form";
import { Badge, EmptyState, ErrorBox, Loading, PageHeader } from "@/components/ui/Layout";
import { SortableList } from "@/components/ui/SortableList";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, useResource } from "@/lib/hooks";
import { mediaUrl } from "@/lib/media";
import type { Category, Page, Product } from "@/lib/types";

export function ProductList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const categoryId = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);

  const categories = useResource<Category[]>("/categories");
  const query = new URLSearchParams({ page_size: "200" });
  if (categoryId) query.set("category_id", categoryId);
  if (q) query.set("q", q);
  const { data, setData, error, loading, reload } = useResource<Page<Product>>(`/products?${query}`);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next}`);
  };

  async function reorder(items: Product[]) {
    if (!categoryId) return;
    const previous = data;
    setData((d) => (d ? { ...d, items } : d));
    try {
      await adminFetch(`/products/reorder?category_id=${categoryId}`, { method: "PUT", body: JSON.stringify({ ids: items.map((p) => p.id) }) });
      toast.success("Order saved");
    } catch (e) {
      setData(previous);
      toast.error(errorMessage(e));
    }
  }

  async function setActive(product: Product, is_active: boolean) {
    try {
      const updated = await adminFetch<Product>(`/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
      setData((d) => (d ? { ...d, items: d.items.map((p) => (p.id === updated.id ? updated : p)) } : d));
      toast.success(`${product.name} is now ${is_active ? "visible" : "hidden"}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const canReorder = Boolean(categoryId) && !q;

  return (
    <>
      <PageHeader
        title="Products"
        description="Product types shown inside each category."
        actions={<LinkButton href={`/products/new${categoryId ? `?category=${categoryId}` : ""}`}>New product</LinkButton>}
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <Select value={categoryId} onChange={(e) => setParam("category", e.target.value)} className="md:max-w-xs" aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim());
          }}
        >
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products and press Enter" aria-label="Search products" />
        </form>
      </div>
      {!canReorder && data && data.items.length > 1 && <p className="mb-3 text-sm text-muted">Choose a category (and clear the search) to drag products into order.</p>}

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.items.length === 0 && <EmptyState title="No products found">{categoryId || q ? "Try another filter." : "Add your first product."}</EmptyState>}
      {data && data.items.length > 0 && (
        <SortableList
          items={data.items}
          getKey={(p) => p.id}
          disabled={!canReorder}
          onReorder={reorder}
          renderItem={(p) => (
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-card bg-cream">
                {(p.cover_image || p.images[0]) && <Image src={mediaUrl(p.cover_image || p.images[0])} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.id}`} className="font-medium hover:text-brand">
                  {p.name}
                </Link>
                <p className="truncate text-sm text-muted">
                  {p.category_name} · {p.slug}
                </p>
              </div>
              {!p.is_active && <Badge>Hidden</Badge>}
              <Toggle checked={p.is_active} onChange={(v) => setActive(p, v)} label="Visible" />
              <LinkButton href={`/products/${p.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
            </div>
          )}
        />
      )}
    </>
  );
}
