"use client";

import Image from "next/image";
import { useState } from "react";

import { Input } from "@/components/ui/Form";
import { ErrorBox, Loading } from "@/components/ui/Layout";
import { Modal } from "@/components/ui/Modal";
import { useResource } from "@/lib/hooks";
import { mediaUrl } from "@/lib/media";
import type { Media, Page } from "@/lib/types";

import { DropZone } from "./DropZone";

/** Choose an image from the media library, or upload a new one and pick it. */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } = useResource<Page<Media>>(
    open ? `/media?page_size=120${query ? `&q=${encodeURIComponent(query)}` : ""}` : null,
  );

  const pick = (url: string) => {
    onPick(url);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Choose media (image or video)" size="xl">
      <DropZone multiple={false} onUploaded={(m) => pick(m.url)} />

      <div className="mt-5 flex gap-2">
        <Input
          value={q}
          onChange={(e) => {
            const next = e.target.value;
            setQ(next);
            if (!next.trim()) setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setQuery(q.trim());
            }
          }}
          placeholder="Search by file name or alt text"
        />
        <button
          type="button"
          onClick={() => setQuery(q.trim())}
          className="rounded-pill bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Search
        </button>
      </div>

      <div className="mt-4">
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !data && <Loading />}
        {data && data.items.length === 0 && <p className="py-6 text-center text-muted">No images found.</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {data?.items.map((m) => {
            const isVideo = m.mime_type?.startsWith("video/") || /\.(mp4|webm|ogv|mov)$/i.test(m.url);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pick(m.url)}
                  className="group block w-full overflow-hidden rounded-card border border-line text-left hover:border-brand focus-visible:border-brand"
                >
                  <div className="relative aspect-square bg-cream flex items-center justify-center overflow-hidden">
                    {isVideo ? (
                      <div className="relative h-full w-full bg-stone-900 flex flex-col items-center justify-center text-white/90">
                        <svg className="h-7 w-7 stroke-current fill-none stroke-2 mb-1" viewBox="0 0 24 24">
                          <polygon points="23 7 16 12 23 17 23 7" fill="currentColor" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-white/70">Video</span>
                      </div>
                    ) : (
                      <Image src={mediaUrl(m.url)} alt={m.alt_text} fill sizes="160px" className="object-cover" />
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs text-muted group-hover:text-ink">{m.filename}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
