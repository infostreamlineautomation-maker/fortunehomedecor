import Image from "next/image";

import { mediaUrl } from "@/lib/media";

type Props = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
};

const isVideo = (url?: string | null) =>
  !!url && /\.(mp4|webm|ogv|mov)$/i.test(url.split("?")[0]);

/** CMS media (image or video) filling its (positioned, sized) parent. Renders a neutral block when no media is set. */
export function MediaImage({ src, alt, sizes, className = "", preload }: Props) {
  if (!src) return <div className={`absolute inset-0 bg-line ${className}`} aria-hidden />;
  if (isVideo(src)) {
    return (
      <video
        src={mediaUrl(src)}
        aria-label={alt}
        autoPlay
        muted
        loop
        playsInline
        className={`size-full object-cover ${className}`}
      />
    );
  }
  return <Image src={mediaUrl(src)} alt={alt} fill sizes={sizes} className={`object-cover ${className}`} preload={preload} />;
}
