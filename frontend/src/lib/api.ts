"use cache";

// Server-side data access for the public API. Every function is cached and tagged; the
// admin API calls /api/revalidate with the same tags after CMS edits (backend/app/services/revalidate.py).
import { cacheLife, cacheTag } from "next/cache";

import type { CategoryCard, CategoryDetail, Faq, ProductDetail, Sections, Settings } from "./types";

const API = (process.env.NEXT_PUBLIC_API_URL ?? process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

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

async function get<T>(path: string, retries = 1): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        console.warn(`[API] ${path} returned status ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[API] Attempt ${attempt + 1} for ${path} failed (${err}), retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn(`[API] Could not fetch ${path} from ${API} (${err}).`);
      return null;
    }
  }
  return null;
}

export async function getSettings(): Promise<Settings> {
  const data = await get<Settings>("/settings");
  if (data) {
    cacheTag("settings");
    cacheLife("hours");
    return data;
  }
  return DEFAULT_SETTINGS;
}

export async function getPage(page: "home" | "about" | "contact" | "products"): Promise<Sections> {
  const data = await get<{ sections: Sections }>(`/pages/${page}`);
  if (data?.sections) {
    cacheTag(`page:${page}`);
    cacheLife("hours");
    return data.sections;
  }
  return {};
}

export async function getCategories(): Promise<CategoryCard[]> {
  const data = await get<CategoryCard[]>("/categories");
  if (data && data.length > 0) {
    cacheTag("categories");
    cacheLife("hours");
    return data;
  }
  return [];
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  const data = await get<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`);
  if (data) {
    cacheTag("categories", `category:${slug}`);
    cacheLife("hours");
  }
  return data;
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const data = await get<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  if (data) {
    cacheTag("categories", `product:${slug}`);
    cacheLife("hours");
  }
  return data;
}

export async function getGlobalFaqs(): Promise<Faq[]> {
  const data = await get<Faq[]>("/faqs");
  if (data && data.length > 0) {
    cacheTag("faqs");
    cacheLife("hours");
    return data;
  }
  return [];
}
