import type { MetadataRoute } from "next";

import { getCategories, getCategory } from "@/lib/api";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();
  const details = await Promise.all(categories.map((c) => getCategory(c.slug)));

  const pages = ["", "/products", "/about", "/contact"].map((path) => ({ url: `${SITE}${path}` }));
  const categoryPages = details.flatMap((c) =>
    !c
      ? []
      : [
          { url: `${SITE}/products/${c.slug}` },
          ...(c.products.length > 0 ? [{ url: `${SITE}/products/${c.slug}/types` }] : []),
        ],
  );
  return [...pages, ...categoryPages];
}
