import { ADMIN_API_URL } from "./api";

/** Resolve a stored media path ("/uploads/...") to an absolute URL on the admin API host. */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${ADMIN_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
