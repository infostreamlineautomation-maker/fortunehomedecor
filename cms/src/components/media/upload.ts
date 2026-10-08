import { adminFetch } from "@/lib/api";
import type { Media } from "@/lib/types";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime";
export const ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
export const MAX_MB = 100;

/** Upload one image or video to the media library. */
export async function uploadImage(file: File, altText = ""): Promise<Media> {
  const allowed = ACCEPT.split(",");
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const isVideoExt = [".mp4", ".webm", ".ogv", ".mov"].includes(ext);
  if (!allowed.includes(file.type) && !isVideoExt) {
    throw new Error(`${file.name}: use a JPG, PNG, WebP, GIF image or MP4, WebM video`);
  }
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`${file.name}: larger than ${MAX_MB} MB`);
  const body = new FormData();
  body.append("file", file);
  body.append("alt_text", altText);
  return adminFetch<Media>("/media", { method: "POST", body });
}
