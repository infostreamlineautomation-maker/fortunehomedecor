"use cache";

// Server-side data access for the public API. Every function is cached and tagged; the
// admin API calls /api/revalidate with the same tags after CMS edits (backend/app/services/revalidate.py).
import { cacheLife, cacheTag } from "next/cache";

import type { CategoryCard, CategoryDetail, Faq, ProductDetail, Sections, Settings } from "./types";

const API = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getSettings(): Promise<Settings> {
  cacheTag("settings");
  cacheLife("hours");
  return (await get<Settings>("/settings"))!;
}

export async function getPage(page: "home" | "about" | "contact" | "products"): Promise<Sections> {
  cacheTag(`page:${page}`);
  cacheLife("hours");
  return (await get<{ sections: Sections }>(`/pages/${page}`))?.sections ?? {};
}

export async function getCategories(): Promise<CategoryCard[]> {
  cacheTag("categories");
  cacheLife("hours");
  return (await get<CategoryCard[]>("/categories")) ?? [];
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  cacheTag("categories", `category:${slug}`);
  cacheLife("hours");
  return get<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  cacheTag("categories", `product:${slug}`);
  cacheLife("hours");
  return get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

export async function getGlobalFaqs(): Promise<Faq[]> {
  cacheTag("faqs");
  cacheLife("hours");
  return (await get<Faq[]>("/faqs")) ?? [];
}
