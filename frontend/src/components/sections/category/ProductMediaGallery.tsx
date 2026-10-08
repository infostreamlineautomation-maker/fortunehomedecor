"use client";

import Image from "next/image";
import { useState, useRef, type TouchEvent } from "react";
import { mediaUrl } from "@/lib/media";

type Props = {
  images: string[];
  productName: string;
  preload?: boolean;
};

const isVideo = (url?: string | null) =>
  !!url && /\.(mp4|webm|ogv|mov)$/i.test(url.split("?")[0]);

export function ProductMediaGallery({ images, productName, preload }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[4/3] md:aspect-[6/5] overflow-hidden rounded-feature bg-stone-100 flex items-center justify-center text-muted">
        <span>No media available</span>
      </div>
    );
  }

  const currentMedia = images[activeIdx] || images[0];
  const currentIsVideo = isVideo(currentMedia);

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) handleNext();
    else if (diff < -40) handlePrev();
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Viewport */}
      <div
        className="group relative aspect-[4/3] md:aspect-[6/5] overflow-hidden rounded-feature bg-ink-soft/5 shadow-sm"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {currentIsVideo ? (
          <video
            key={currentMedia}
            src={mediaUrl(currentMedia)}
            controls
            playsInline
            autoPlay
            muted
            loop
            className="size-full object-cover"
          />
        ) : (
          <Image
            key={currentMedia}
            src={mediaUrl(currentMedia)}
            alt={`${productName} - view ${activeIdx + 1}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={preload && activeIdx === 0}
            className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
          />
        )}

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-pill bg-black/60 px-3 py-1 font-mono text-xs font-medium text-white backdrop-blur-sm shadow-sm">
            {activeIdx + 1} / {images.length}
          </div>
        )}

        {/* Navigation Arrows (when multiple media items exist) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous item"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 opacity-90 md:opacity-0 md:group-hover:opacity-100"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next item"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 opacity-90 md:opacity-0 md:group-hover:opacity-100"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Bar (rendered when multiple media items exist) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => {
            const isActive = idx === activeIdx;
            const itemIsVideo = isVideo(img);
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`View item ${idx + 1}`}
                aria-current={isActive}
                className={`relative size-16 shrink-0 md:size-20 overflow-hidden rounded-lg transition-all ${
                  isActive
                    ? "ring-2 ring-brand ring-offset-2 scale-95 opacity-100"
                    : "opacity-60 hover:opacity-100 hover:scale-100"
                }`}
              >
                {itemIsVideo ? (
                  <div className="relative size-full bg-stone-900 flex items-center justify-center">
                    <video
                      src={mediaUrl(img)}
                      className="size-full object-cover pointer-events-none"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <svg className="size-5 fill-white text-white drop-shadow" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={mediaUrl(img)}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
