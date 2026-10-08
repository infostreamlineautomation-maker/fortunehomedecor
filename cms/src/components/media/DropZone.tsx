"use client";

import { useRef, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/hooks";
import type { Media } from "@/lib/types";

import { ACCEPT, MAX_MB, uploadImage } from "./upload";

/** Drag-and-drop / click-to-browse uploader. Uploads files one by one and reports each result. */
export function DropZone({ onUploaded, multiple = true }: { onUploaded: (media: Media) => void; multiple?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const toast = useToast();

  async function handle(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setProgress({ done: 0, total: list.length });
    let ok = 0;
    for (const [i, file] of list.entries()) {
      try {
        onUploaded(await uploadImage(file));
        ok++;
      } catch (e) {
        toast.error(errorMessage(e));
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (ok) toast.success(`Uploaded ${ok} image${ok === 1 ? "" : "s"}`);
    if (input.current) input.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handle(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors ${
        over ? "border-brand bg-brand-tint" : "border-line bg-cream"
      }`}
    >
      {progress ? (
        <p className="text-sm">
          Uploading {progress.done} / {progress.total}…
        </p>
      ) : (
        <>
          <p className="text-sm">
            Drag files here or{" "}
            <button type="button" onClick={() => input.current?.click()} className="font-medium text-brand underline">
              browse
            </button>
          </p>
          <p className="text-xs text-muted">JPG, PNG, WebP, GIF or MP4, WebM · up to {MAX_MB} MB each</p>
        </>
      )}
      <input ref={input} type="file" accept={ACCEPT} multiple={multiple} hidden onChange={(e) => void handle(e.target.files)} />
    </div>
  );
}
