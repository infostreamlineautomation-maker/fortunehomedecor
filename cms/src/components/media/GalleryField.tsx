"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { move } from "@/components/ui/SortableList";
import { mediaUrl } from "@/lib/media";

import { MediaPicker } from "./MediaPicker";

const isVideo = (url?: string | null) =>
  !!url && /\.(mp4|webm|ogv|mov)$/i.test(url.split("?")[0]);

/** Ordered list of media items (category gallery, product images/videos). */
export function GalleryField({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{label}</p>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Add image / video
        </Button>
      </div>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      {value.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No media added yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, i) => {
            const itemIsVideo = isVideo(url);
            return (
              <li key={`${url}-${i}`} className="overflow-hidden rounded-card border border-line bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden flex items-center justify-center">
                  {itemIsVideo ? (
                    <>
                      <video src={mediaUrl(url)} className="size-full object-cover pointer-events-none" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">Video</span>
                      </div>
                    </>
                  ) : (
                    <Image src={mediaUrl(url)} alt="" fill sizes="200px" className="object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between px-2 py-1.5 text-xs bg-white">
                  <span className="text-muted">#{i + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))} className="px-1 disabled:opacity-30">
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Move right"
                      disabled={i === value.length - 1}
                      onClick={() => onChange(move(value, i, i + 1))}
                      className="px-1 disabled:opacity-30"
                    >
                      →
                    </button>
                    <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-1 text-brand">
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onChange([...value, url])} />
    </div>
  );
}
