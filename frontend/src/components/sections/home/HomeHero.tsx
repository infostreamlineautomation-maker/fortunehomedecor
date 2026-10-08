"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { MediaImage } from "@/components/ui/MediaImage";
import { mediaUrl } from "@/lib/media";
import type { Sections } from "@/lib/types";

type S = Sections[string];

type Slide = {
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

export function HomeHero({
  hero,
  className = "aspect-[4/3] md:aspect-auto md:h-[clamp(340px,72vh,660px)]",
}: {
  hero: S;
  className?: string;
}) {
  const mediaType = (hero.media_type as string) || (hero.slides && Array.isArray(hero.slides) && hero.slides.length > 0 ? "slideshow" : hero.video_url ? "video" : "image");

  if (mediaType === "video" && hero.video_url) {
    return <VideoHero hero={hero} className={className} />;
  }

  if (mediaType === "slideshow" && Array.isArray(hero.slides) && hero.slides.length > 0) {
    return <SlideshowHero hero={hero} slides={hero.slides as Slide[]} className={className} />;
  }

  return <ImageHero hero={hero} className={className} />;
}

/** 1. STATIC IMAGE HERO */
function ImageHero({ hero, className }: { hero: S; className: string }) {
  return (
    <section className={`relative w-full overflow-hidden ${className}`}>
      <MediaImage src={hero.image} alt={hero.alt ?? ""} sizes="100vw" preload />
      {(hero.title || hero.subtitle) && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/15 to-transparent">
          <div className="container-site pb-6 text-white md:pb-12">
            {hero.title && <h1 className="max-w-3xl font-display text-hero font-bold drop-shadow-md">{hero.title}</h1>}
            {hero.subtitle && <p className="mt-2 max-w-xl text-lead drop-shadow-sm md:mt-3">{hero.subtitle}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

/** 2. VIDEO BANNER HERO */
function VideoHero({ hero, className }: { hero: S; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(hero.autoplay !== false);
  const [isMuted, setIsMuted] = useState(hero.muted !== false);

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
    <section className={`relative w-full overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        src={mediaUrl(hero.video_url as string)}
        poster={hero.poster_image ? mediaUrl(hero.poster_image as string) : undefined}
        autoPlay={hero.autoplay !== false}
        loop={hero.loop !== false}
        muted={hero.muted !== false}
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay gradient for text legibility */}
      {(hero.title || hero.subtitle) && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          <div className="container-site pb-6 text-white md:pb-12">
            {hero.title && <h1 className="max-w-3xl font-display text-hero font-bold drop-shadow-md">{hero.title}</h1>}
            {hero.subtitle && <p className="mt-3 max-w-xl text-lead drop-shadow-sm">{hero.subtitle}</p>}
          </div>
        </div>
      )}

      {/* Subtle bottom-right video controls */}
      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2 md:right-4 md:bottom-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="flex size-8 items-center justify-center rounded-full bg-black/40 md:size-9 text-white backdrop-blur-md transition-colors hover:bg-black/70"
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
          className="flex size-8 items-center justify-center rounded-full bg-black/40 md:size-9 text-white backdrop-blur-md transition-colors hover:bg-black/70"
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
    </section>
  );
}

/** 3. MULTI-MEDIA SLIDESHOW HERO (IMAGES & VIDEOS) */
function SlideshowHero({ hero, slides, className }: { hero: S; slides: Slide[]; className: string }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const intervalSeconds = Number(hero.interval_seconds ?? 5) || 5;
  const autoplay = hero.autoplay !== false && slides.length > 1;
  const showArrows = hero.show_arrows !== false && slides.length > 1;
  const showDots = hero.show_dots !== false && slides.length > 1;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay timer
  useEffect(() => {
    if (!autoplay || isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [autoplay, isPaused, intervalSeconds, nextSlide]);

  // Manage video playback based on active slide
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

  // Touch swipe handling
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
    <section
      className={`relative w-full overflow-hidden bg-stone-950 select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Home Slideshow"
    >
      {/* Slides */}
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        const isVideo = slide.type === "video" || !!slide.video_url;
        const title = slide.title || (idx === 0 ? (hero.title as string) : "");
        const subtitle = slide.subtitle || (idx === 0 ? (hero.subtitle as string) : "");

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

            {/* Slide Content & Gradient Overlay */}
            {(title || subtitle || slide.cta_label) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/25 to-transparent">
                <div className="container-site pb-10 text-white md:pb-14">
                  {title && (
                    <h2 className="max-w-3xl font-display text-hero font-bold tracking-tight drop-shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-2 max-w-xl text-lead text-white/90 drop-shadow-sm md:mt-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                      {subtitle}
                    </p>
                  )}
                  {slide.cta_label && (
                    <div className="mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                      <Link
                        href={slide.cta_href || "/products"}
                        className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-xs font-medium text-white shadow-md md:px-6 md:py-2.5 md:text-sm transition-all hover:bg-brand-strong hover:scale-105"
                      >
                        {slide.cta_label}
                        <Image src="/icons/circled-arrow.png" alt="" width={20} height={16} className="rotate-180" />
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
            className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 md:left-4 md:size-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/65 hover:scale-110"
          >
            <svg className="size-4 fill-none stroke-current stroke-2 md:size-5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 md:right-4 md:size-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/65 hover:scale-110"
          >
            <svg className="size-4 fill-none stroke-current stroke-2 md:size-5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {showDots && (
        <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 md:bottom-5 md:gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-6 bg-brand shadow-md md:w-8"
                  : "w-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
