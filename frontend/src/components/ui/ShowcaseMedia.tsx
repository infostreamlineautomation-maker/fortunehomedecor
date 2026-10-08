"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { MediaImage } from "@/components/ui/MediaImage";
import { mediaUrl } from "@/lib/media";

export type SlideItem = {
  type?: "image" | "video";
  image?: string;
  video_url?: string;
  poster_image?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
};

export type ShowcaseMediaData = {
  media_type?: "image" | "video" | "slideshow" | string;
  image?: string;
  video_url?: string;
  poster_image?: string;
  alt?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  interval_seconds?: number;
  show_arrows?: boolean;
  show_dots?: boolean;
  slides?: SlideItem[];
};

interface ShowcaseMediaProps {
  media: ShowcaseMediaData;
  aspectRatio?: string; // e.g. "aspect-[16/8]" or "aspect-[1666/787]"
  className?: string;
}

export function ShowcaseMedia({
  media,
  aspectRatio = "aspect-[1666/787]",
  className = "",
}: ShowcaseMediaProps) {
  const mediaType =
    media.media_type ||
    (media.slides && Array.isArray(media.slides) && media.slides.length > 0
      ? "slideshow"
      : media.video_url
        ? "video"
        : "image");

  if (mediaType === "video" && media.video_url) {
    return <VideoShowcase media={media} aspectRatio={aspectRatio} className={className} />;
  }

  if (mediaType === "slideshow" && Array.isArray(media.slides) && media.slides.length > 0) {
    return (
      <SlideshowShowcase
        media={media}
        slides={media.slides}
        aspectRatio={aspectRatio}
        className={className}
      />
    );
  }

  if (!media.image) return null;

  return (
    <div className={`relative w-full overflow-hidden ${aspectRatio} ${className}`}>
      <MediaImage src={media.image} alt={media.alt ?? ""} sizes="100vw" />
    </div>
  );
}

function VideoShowcase({
  media,
  aspectRatio,
  className,
}: {
  media: ShowcaseMediaData;
  aspectRatio: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(media.autoplay !== false);
  const [isMuted, setIsMuted] = useState(media.muted !== false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-black ${aspectRatio} ${className}`}>
      <video
        ref={videoRef}
        src={mediaUrl(media.video_url as string)}
        poster={media.poster_image || media.image ? mediaUrl((media.poster_image || media.image)!) : undefined}
        autoPlay={media.autoplay !== false}
        loop={media.loop !== false}
        muted={media.muted !== false}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Video controls in bottom corner */}
      <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/70"
        >
          {isPlaying ? (
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-4 w-4 fill-current" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/70"
        >
          {isMuted ? (
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <line x1="22" y1="9" x2="16" y2="15" strokeLinecap="round" />
              <line x1="16" y1="9" x2="22" y2="15" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function SlideshowShowcase({
  media,
  slides,
  aspectRatio,
  className,
}: {
  media: ShowcaseMediaData;
  slides: SlideItem[];
  aspectRatio: string;
  className: string;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const intervalSeconds = Number(media.interval_seconds ?? 5) || 5;
  const autoplay = media.autoplay !== false && slides.length > 1;
  const showArrows = media.show_arrows !== false && slides.length > 1;
  const showDots = media.show_dots !== false && slides.length > 1;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [autoplay, isPaused, intervalSeconds, nextSlide]);

  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === current) {
        vid.currentTime = 0;
        void vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-stone-950 select-none ${aspectRatio} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        const isVideo = slide.type === "video" || !!slide.video_url;

        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!isActive}
          >
            {isVideo && slide.video_url ? (
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={mediaUrl(slide.video_url)}
                poster={slide.image || slide.poster_image ? mediaUrl(slide.image || slide.poster_image!) : undefined}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <MediaImage
                src={slide.image}
                alt={slide.alt || `Slide ${idx + 1}`}
                sizes="100vw"
                preload={idx === 0}
                className={`transform transition-transform duration-7000 ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
            )}

            {/* Optional Slide Content */}
            {(slide.title || slide.subtitle || slide.cta_label) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/25 to-transparent">
                <div className="p-6 md:p-10 text-white">
                  {slide.title && (
                    <h3 className="text-xl md:text-2xl font-display font-bold">{slide.title}</h3>
                  )}
                  {slide.subtitle && (
                    <p className="mt-1 text-sm md:text-base text-white/90">{slide.subtitle}</p>
                  )}
                  {slide.cta_label && (
                    <div className="mt-4">
                      <Link
                        href={slide.cta_href || "/products"}
                        className="inline-flex items-center gap-2 rounded-pill bg-brand px-5 py-2 text-xs md:text-sm font-medium text-white shadow-md hover:bg-brand-strong"
                      >
                        {slide.cta_label}
                        <Image src="/icons/circled-arrow.png" alt="" width={18} height={14} className="rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Prev / Next Arrows */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105"
          >
            <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:scale-105"
          >
            <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Dots */}
      {showDots && (
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current ? "w-6 bg-brand shadow-md" : "w-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
