"use client";

import { useEffect } from "react";

/**
 * Streamed content arrives after the browser's own #hash scroll, so links like
 * /products/curtains/types#dimout-curtains would stay at the top. Render this after the target content.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    // Next.js settles its own scroll position during hydration; jump after it
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
