"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";

type DeviceMode = "desktop" | "tablet" | "mobile";

type Props = {
  open: boolean;
  onClose: () => void;
  siteUrl: string;
  initialPath?: string;
  onPublishSuccess?: () => void;
};

export function PreviewModal({ open, onClose, siteUrl, initialPath = "/", onPublishSuccess }: Props) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [publishing, setPublishing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const toast = useToast();

  if (!open) return null;

  const targetUrl = `${siteUrl.replace(/\/$/, "")}${initialPath.startsWith("/") ? initialPath : `/${initialPath}`}`;

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await adminFetch("/settings/publish", { method: "POST" });
      toast.success("Website changes successfully published live!");
      onPublishSuccess?.();
    } catch {
      toast.error("Failed to publish website. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const deviceWidths: Record<DeviceMode, string> = {
    desktop: "w-full h-full",
    tablet: "w-[768px] h-[92%] rounded-2xl border-4 border-stone-800 shadow-2xl",
    mobile: "w-[390px] h-[85%] rounded-3xl border-4 border-stone-800 shadow-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md text-white animate-in fade-in duration-200">
      {/* Top Preview Bar */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 md:px-6 bg-stone-900/90">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white uppercase">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Preview
          </span>
          <span className="hidden text-xs text-stone-400 sm:inline truncate max-w-[280px]">
            {targetUrl}
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 rounded-pill bg-stone-800/80 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
              device === "desktop" ? "bg-white text-stone-900 font-semibold shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={2} />
              <path strokeWidth={2} d="M8 21h8M12 17v4" />
            </svg>
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
              device === "tablet" ? "bg-white text-stone-900 font-semibold shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
            </svg>
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
              device === "mobile" ? "bg-white text-stone-900 font-semibold shadow" : "text-stone-300 hover:text-white"
            }`}
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={2} />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
            </svg>
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload preview"
            className="rounded-lg p-2 text-stone-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            New Tab ↗
          </a>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 rounded-pill bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {publishing ? (
              <>
                <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing…
              </>
            ) : (
              <>
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                </svg>
                Publish Live
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2 md:p-4 bg-stone-950">
        <div className={`transition-all duration-300 overflow-hidden ${deviceWidths[device]} bg-white flex flex-col`}>
          <iframe
            key={iframeKey}
            src={targetUrl}
            title="Website Live Preview"
            className="size-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
