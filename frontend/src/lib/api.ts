"use cache";

// Server-side data access for the public API. Every function is cached and tagged; the
// admin API calls /api/revalidate with the same tags after CMS edits (backend/app/services/revalidate.py).
import { cacheLife, cacheTag } from "next/cache";

import type { CategoryCard, CategoryDetail, Faq, ProductDetail, Sections, Settings } from "./types";

const API = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const DEFAULT_SETTINGS: Settings = {
  brand: {
    name: "Fortune Decor",
    logo: "/uploads/figma/brand/logo.png",
    tagline: "Curtain & Blind Automation",
    description: "Premium window fashion and automation solutions.",
  },
  contact: {
    email: "info@fortunedecor.com",
    phone: "+91 98765 43210",
    address: "Surat, Gujarat, India",
    location: "Surat, Gujarat",
  },
  socials: {},
  footer: {
    copyright: "© 2026 Fortune Decor. All rights reserved.",
    cta_label: "Request a Quote",
    cta_href: "/contact",
  },
  seo: {
    default_title: "Fortune Decor | Window Automation & Blinds",
    default_description: "Premium curtains, blinds, and motorized window treatments.",
  },
};

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[API] ${path} returned status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] Could not fetch ${path} from ${API} during build (${err}).`);
    return null;
  }
}

export async function getSettings(): Promise<Settings> {
  cacheTag("settings");
  cacheLife("hours");
  const data = await get<Settings>("/settings");
  return data ?? DEFAULT_SETTINGS;
}

export async function getPage(page: "home" | "about" | "contact" | "products"): Promise<Sections> {
  cacheTag(`page:${page}`);
  cacheLife("hours");
  const data = await get<{ sections: Sections }>(`/pages/${page}`);
  return data?.sections ?? {};
}

export async function getCategories(): Promise<CategoryCard[]> {
  cacheTag("categories");
  cacheLife("hours");
  const data = await get<CategoryCard[]>("/categories");
  return data ?? [];
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
