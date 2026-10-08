"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { mediaUrl } from "@/lib/media";

import { MediaPicker } from "./MediaPicker";

const isVideo = (url?: string | null) =>
  !!url && /\.(mp4|webm|ogv|mov)$/i.test(url.split("?")[0]);

/** Single media item (image or video) picked from the media library (stores the /uploads/... path). */
export function ImageField({
  label,
  value,
  onChange,
  hint,
  aspect = "aspect-[4/3]",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  hint?: string;
  aspect?: string;
}) {
  const [open, setOpen] = useState(false);
  const itemIsVideo = isVideo(value);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-start gap-4">
        <div className={`relative w-40 shrink-0 overflow-hidden rounded-card border border-line bg-cream ${aspect}`}>
          {value ? (
            itemIsVideo ? (
              <div className="relative size-full bg-stone-900 flex items-center justify-center">
                <video src={mediaUrl(value)} className="size-full object-cover pointer-events-none" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">Video</span>
                </div>
              </div>
            ) : (
              <Image src={mediaUrl(value)} alt="" fill sizes="160px" className="object-cover" />
            )
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">No media</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose media"}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
          {hint && <p className="max-w-[220px] text-xs text-muted">{hint}</p>}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onChange(url)} />
    </div>
  );
}
