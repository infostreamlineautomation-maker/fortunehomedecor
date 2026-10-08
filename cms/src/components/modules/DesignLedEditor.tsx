"use client";

import { useState } from "react";

import { ImageField } from "@/components/media/ImageField";
import { MediaPicker } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/Form";
import { move } from "@/components/ui/SortableList";
import { mediaUrl } from "@/lib/media";
import type { JsonObject } from "@/lib/types";

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

export function DesignLedEditor({
  value,
  onChange,
}: {
  value: JsonObject;
  onChange: (v: JsonObject) => void;
}) {
  const mediaType = (value.media_type as string) || (value.slides ? "slideshow" : value.video_url ? "video" : "image");
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [activeSlideVideoPicker, setActiveSlideVideoPicker] = useState<number | null>(null);

  const paragraphs: string[] = Array.isArray(value.paragraphs)
    ? (value.paragraphs as string[])
    : typeof value.text === "string" && value.text
      ? [value.text]
      : [""];

  const setMediaType = (type: "image" | "video" | "slideshow") => {
    onChange({
      ...value,
      media_type: type,
    });
  };

  const updateParagraphs = (next: string[]) => {
    onChange({
      ...value,
      paragraphs: next,
    });
  };

  const slides: SlideItem[] = Array.isArray(value.slides)
    ? (value.slides as SlideItem[])
    : [
        {
          type: "image",
          image: (value.image as string) || "",
          alt: (value.alt as string) || "",
          title: "",
          subtitle: "",
          cta_label: "",
          cta_href: "",
        },
      ];

  const updateSlides = (newSlides: SlideItem[]) => {
    onChange({
      ...value,
      media_type: "slideshow",
      slides: newSlides,
    });
  };

  const updateSlide = (index: number, patch: Partial<SlideItem>) => {
    const next = slides.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateSlides(next);
  };

  const addSlide = (slideType: "image" | "video" = "image") => {
    updateSlides([
      ...slides,
      {
        type: slideType,
        image: "",
        video_url: "",
        alt: "",
        title: "",
        subtitle: "",
        cta_label: "",
        cta_href: "",
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Content Fields */}
      <div className="space-y-4 rounded-card border border-line bg-white p-4 shadow-xs">
        <h4 className="text-sm font-semibold text-brand uppercase tracking-wider">Text Content</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow (Small text above heading)">
            <Input
              value={(value.eyebrow as string) || ""}
              onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
              placeholder="e.g. Who We Are"
            />
          </Field>
          <Field label="Section Heading">
            <Input
              value={(value.heading as string) || ""}
              onChange={(e) => onChange({ ...value, heading: e.target.value })}
              placeholder="e.g. Design-Led Solutions for Every Surface"
            />
          </Field>
        </div>

        {/* Paragraphs Manager */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink uppercase tracking-wider">
              Description Paragraphs ({paragraphs.length})
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => updateParagraphs([...paragraphs, ""])}
            >
              + Add Paragraph
            </Button>
          </div>

          <ol className="space-y-3">
            {paragraphs.map((para, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="mt-2.5 text-xs font-semibold text-muted">{i + 1}.</span>
                <div className="flex-1">
                  <Textarea
                    rows={3}
                    value={para}
                    onChange={(e) => {
                      const next = [...paragraphs];
                      next[i] = e.target.value;
                      updateParagraphs(next);
                    }}
                    placeholder={`Paragraph ${i + 1}`}
                  />
                </div>
                {paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => updateParagraphs(paragraphs.filter((_, j) => j !== i))}
                    className="mt-2 text-xs font-semibold text-brand hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Media Showcase Selector */}
      <div className="space-y-4 rounded-card border border-line bg-white p-4 shadow-xs">
        <h4 className="text-sm font-semibold text-brand uppercase tracking-wider">Showcase Media Display</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMediaType("image")}
            className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 p-3 text-sm font-semibold transition-all ${
              mediaType === "image"
                ? "border-brand bg-brand-tint text-brand shadow-xs"
                : "border-line bg-cream/40 text-ink/75 hover:border-brand/40"
            }`}
          >
            <svg className="h-5 w-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Static Image</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaType("video")}
            className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 p-3 text-sm font-semibold transition-all ${
              mediaType === "video"
                ? "border-brand bg-brand-tint text-brand shadow-xs"
                : "border-line bg-cream/40 text-ink/75 hover:border-brand/40"
            }`}
          >
            <svg className="h-5 w-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Background Video</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaType("slideshow")}
            className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 p-3 text-sm font-semibold transition-all ${
              mediaType === "slideshow"
                ? "border-brand bg-brand-tint text-brand shadow-xs"
                : "border-line bg-cream/40 text-ink/75 hover:border-brand/40"
            }`}
          >
            <svg className="h-5 w-5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span>Multi-Slide Carousel</span>
          </button>
        </div>

        {/* IMAGE MODE */}
        {mediaType === "image" && (
          <div className="space-y-4 pt-2">
            <ImageField
              label="Showcase Banner Image"
              value={(value.image as string) || null}
              onChange={(url) => onChange({ ...value, image: url ?? "" })}
            />
            <Field label="Image Alt Text (SEO & Accessibility)">
              <Input
                value={(value.alt as string) || ""}
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
                placeholder="e.g. Interior design showcase with curtains and stretch ceiling"
              />
            </Field>
          </div>
        )}

        {/* VIDEO MODE */}
        {mediaType === "video" && (
          <div className="space-y-4 pt-2">
            <Field label="Video File or URL">
              <div className="flex gap-2">
                <Input
                  value={(value.video_url as string) || ""}
                  onChange={(e) => onChange({ ...value, video_url: e.target.value })}
                  placeholder="/uploads/library/showcase.mp4 or https://..."
                />
                <Button type="button" variant="secondary" onClick={() => setVideoPickerOpen(true)}>
                  Choose video
                </Button>
              </div>
            </Field>

            {value.video_url && (
              <div className="relative aspect-video max-h-52 w-full overflow-hidden rounded-card bg-black">
                <video
                  src={mediaUrl(value.video_url as string)}
                  controls
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <MediaPicker
              open={videoPickerOpen}
              onClose={() => setVideoPickerOpen(false)}
              onPick={(url) => onChange({ ...value, video_url: url })}
            />

            <ImageField
              label="Fallback / Poster Image"
              value={(value.poster_image as string) || (value.image as string) || null}
              onChange={(url) => onChange({ ...value, poster_image: url ?? "", image: url ?? (value.image as string) ?? "" })}
            />

            <div className="grid gap-3 rounded-card border border-line bg-cream/40 p-3 sm:grid-cols-3">
              <Toggle
                checked={value.autoplay !== false}
                onChange={(v) => onChange({ ...value, autoplay: v })}
                label="Autoplay"
              />
              <Toggle
                checked={value.loop !== false}
                onChange={(v) => onChange({ ...value, loop: v })}
                label="Loop video"
              />
              <Toggle
                checked={value.muted !== false}
                onChange={(v) => onChange({ ...value, muted: v })}
                label="Muted audio"
              />
            </div>
          </div>
        )}

        {/* SLIDESHOW MODE */}
        {mediaType === "slideshow" && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Slides ({slides.length})
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addSlide("image")}>
                  + Image Slide
                </Button>
                <Button size="sm" onClick={() => addSlide("video")}>
                  + Video Slide
                </Button>
              </div>
            </div>

            {/* Slideshow Settings */}
            <div className="grid gap-3 rounded-card border border-line bg-cream/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <Toggle
                checked={value.autoplay !== false}
                onChange={(v) => onChange({ ...value, autoplay: v })}
                label="Auto-advance"
              />
              <Field label="Duration">
                <Select
                  value={String(value.interval_seconds ?? 5)}
                  onChange={(e) => onChange({ ...value, interval_seconds: Number(e.target.value) })}
                >
                  <option value="3">3 seconds</option>
                  <option value="4">4 seconds</option>
                  <option value="5">5 seconds (Recommended)</option>
                  <option value="7">7 seconds</option>
                  <option value="10">10 seconds</option>
                </Select>
              </Field>
              <Toggle
                checked={value.show_arrows !== false}
                onChange={(v) => onChange({ ...value, show_arrows: v })}
                label="Show arrows"
              />
              <Toggle
                checked={value.show_dots !== false}
                onChange={(v) => onChange({ ...value, show_dots: v })}
                label="Show dots"
              />
            </div>

            {/* Slide List */}
            <ol className="space-y-4">
              {slides.map((slide, idx) => {
                const isVideoSlide = slide.type === "video" || !!slide.video_url;

                return (
                  <li key={idx} className="rounded-card border border-line bg-cream/60 p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand">Slide #{idx + 1}</span>
                        <div className="inline-flex rounded-pill border border-line bg-white p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, { type: "image" })}
                            className={`rounded-pill px-2.5 py-0.5 font-medium transition-all ${
                              !isVideoSlide ? "bg-brand text-white" : "text-muted hover:text-ink"
                            }`}
                          >
                            Image
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlide(idx, { type: "video" })}
                            className={`rounded-pill px-2.5 py-0.5 font-medium transition-all ${
                              isVideoSlide ? "bg-brand text-white" : "text-muted hover:text-ink"
                            }`}
                          >
                            Video
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={idx === 0}
                          onClick={() => updateSlides(move(slides, idx, idx - 1))}
                          className="rounded px-2 py-1 text-xs hover:bg-neutral-200 disabled:opacity-30"
                        >
                          ▲ Up
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={idx === slides.length - 1}
                          onClick={() => updateSlides(move(slides, idx, idx + 1))}
                          className="rounded px-2 py-1 text-xs hover:bg-neutral-200 disabled:opacity-30"
                        >
                          ▼ Down
                        </button>
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateSlides(slides.filter((_, j) => j !== idx))}
                            className="ml-2 rounded px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-tint"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        {isVideoSlide ? (
                          <div className="space-y-3">
                            <Field label="Slide Video File or URL">
                              <div className="flex gap-2">
                                <Input
                                  value={slide.video_url || ""}
                                  onChange={(e) => updateSlide(idx, { video_url: e.target.value })}
                                  placeholder="/uploads/library/showcase.mp4"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setActiveSlideVideoPicker(idx)}
                                >
                                  Choose
                                </Button>
                              </div>
                            </Field>
                            <ImageField
                              label="Fallback / Poster Image"
                              value={slide.image || slide.poster_image || null}
                              onChange={(url) => updateSlide(idx, { image: url ?? "", poster_image: url ?? "" })}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <ImageField
                              label="Slide Image"
                              value={slide.image || null}
                              onChange={(url) => updateSlide(idx, { image: url ?? "" })}
                            />
                            <Field label="Alt Text (SEO)">
                              <Input
                                value={slide.alt || ""}
                                onChange={(e) => updateSlide(idx, { alt: e.target.value })}
                                placeholder="Image description"
                              />
                            </Field>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Field label="Slide Title (Optional)">
                          <Input
                            value={slide.title || ""}
                            onChange={(e) => updateSlide(idx, { title: e.target.value })}
                            placeholder="Optional headline"
                          />
                        </Field>
                        <Field label="Slide Subtitle (Optional)">
                          <Input
                            value={slide.subtitle || ""}
                            onChange={(e) => updateSlide(idx, { subtitle: e.target.value })}
                            placeholder="Optional subhead"
                          />
                        </Field>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <MediaPicker
              open={activeSlideVideoPicker !== null}
              onClose={() => setActiveSlideVideoPicker(null)}
              onPick={(url) => {
                if (activeSlideVideoPicker !== null) {
                  updateSlide(activeSlideVideoPicker, { video_url: url });
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
