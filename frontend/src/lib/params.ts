import { getCategories } from "./api";

/** Placeholder param so `next build` succeeds when the API has no data (Cache Components needs ≥ 1). */
export const PLACEHOLDER = "__placeholder__";

export async function categoryParams(): Promise<{ category: string }[]> {
  const categories = await getCategories().catch(() => []);
  return categories.length > 0 ? categories.map((c) => ({ category: c.slug })) : [{ category: PLACEHOLDER }];
}
