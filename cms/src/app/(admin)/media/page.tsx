"use client";

import Image from "next/image";
import { useState } from "react";

import { DropZone } from "@/components/media/DropZone";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Form";
import { EmptyState, ErrorBox, Loading, PageHeader, Pagination } from "@/components/ui/Layout";
import { Modal, useConfirm } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { errorMessage, formatBytes, formatDate, useResource } from "@/lib/hooks";
import { mediaUrl } from "@/lib/media";
import type { Media, Page } from "@/lib/types";

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);

  const qs = new URLSearchParams({ page: String(page), page_size: "48" });
  if (query) qs.set("q", query);
  if (folder) qs.set("folder", folder);
  const { data, setData, error, loading, reload } = useResource<Page<Media>>(`/media?${qs}`);
  const folders = useResource<string[]>("/media/folders");

  return (
    <>
      <PageHeader title="Media Library" description="Images used across the website. Everything is stored in the server's uploads folder." />

      <DropZone
        onUploaded={(m) => {
          // Show new uploads first without refetching the page
          setData((d) => (d && page === 1 && !query && (!folder || folder === m.folder) ? { ...d, items: [m, ...d.items], total: d.total + 1 } : d));
        }}
      />

      <div className="mt-6 mb-5 flex flex-col gap-3 md:flex-row">
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
        >
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search file name or alt text and press Enter" aria-label="Search media" />
        </form>
        <Select
          value={folder}
          onChange={(e) => {
            setPage(1);
            setFolder(e.target.value);
          }}
          className="md:max-w-[220px]"
          aria-label="Folder"
        >
          <option value="">All folders</option>
          {folders.data?.map((f) => (
            <option key={f} value={f}>
              {f === "figma" ? "Website images (Figma)" : f === "library" ? "Uploads" : f}
            </option>
          ))}
        </Select>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.items.length === 0 && <EmptyState title="No images found" />}
      {data && data.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {data.items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setSelected(m)} className="group block w-full overflow-hidden rounded-card border border-line bg-white text-left hover:border-brand">
                <div className="relative aspect-square bg-cream">
                  <Image src={mediaUrl(m.url)} alt={m.alt_text} fill sizes="(min-width: 1280px) 16vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm group-hover:text-brand">{m.filename}</p>
                  <p className="text-xs text-muted">
                    {m.width}×{m.height} · {formatBytes(m.size_bytes)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />}

      {selected && (
        <MediaDetails
          media={selected}
          onClose={() => setSelected(null)}
          onUpdated={(m) => {
            setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === m.id ? m : x)) } : d));
            setSelected(m);
          }}
          onDeleted={(id) => {
            setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== id), total: d.total - 1 } : d));
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function MediaDetails({ media, onClose, onUpdated, onDeleted }: { media: Media; onClose: () => void; onUpdated: (m: Media) => void; onDeleted: (id: number) => void }) {
  const [alt, setAlt] = useState(media.alt_text);
  const [saving, setSaving] = useState(false);
  const usage = useResource<string[]>(`/media/${media.id}/usage`);
  const toast = useToast();
  const confirm = useConfirm();

  async function saveAlt() {
    setSaving(true);
    try {
      onUpdated(await adminFetch<Media>(`/media/${media.id}`, { method: "PATCH", body: JSON.stringify({ alt_text: alt }) }));
      toast.success("Alt text saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({ title: "Delete image?", message: `${media.filename} will be permanently deleted from the server.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await adminFetch(`/media/${media.id}`, { method: "DELETE" });
      toast.success("Image deleted");
      onDeleted(media.id);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const inUse = (usage.data?.length ?? 0) > 0;

  return (
    <Modal open onClose={onClose} title={media.filename} size="lg">
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-card bg-cream">
          <Image src={mediaUrl(media.url)} alt={media.alt_text} fill sizes="480px" className="object-contain" />
        </div>
        <div className="space-y-4 text-sm">
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Size</dt>
              <dd>
                {media.width}×{media.height} px · {formatBytes(media.size_bytes)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Type</dt>
              <dd>{media.mime_type}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Uploaded</dt>
              <dd>{formatDate(media.created_at)}</dd>
            </div>
          </dl>
          <Field label="Alt text" hint="Describe the image for screen readers and search engines.">
            <Input value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <Button size="sm" onClick={saveAlt} loading={saving} disabled={alt === media.alt_text}>
            Save alt text
          </Button>
          <div>
            <p className="mb-1 font-medium">Used in</p>
            {usage.loading ? (
              <p className="text-muted">Checking…</p>
            ) : inUse ? (
              <ul className="list-inside list-disc text-muted">
                {usage.data?.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Not used anywhere.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(mediaUrl(media.url));
                toast.success("Link copied");
              }}
            >
              Copy link
            </Button>
            <Button size="sm" variant="danger" onClick={remove} disabled={inUse} title={inUse ? "Remove it from the places above first" : undefined}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
