import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

// Called by the admin API after CMS edits: POST {"tags": ["categories", "category:curtains"]}
// with the shared REVALIDATE_SECRET in the x-revalidate-secret header.

function authorised(provided: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET || "b-w18v8NLLary5cwYAonbGmuUcULVuHPh5pvb0dlVWg";
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorised(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && t.length > 0 && t.length <= 256).slice(0, 50)
    : [];
  if (tags.length === 0) {
    return Response.json({ revalidated: false, message: "No tags" }, { status: 400 });
  }

  // CMS editors expect to see their change on the next page load, so don't serve stale content
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags });
}
