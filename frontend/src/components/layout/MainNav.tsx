"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavLink = {
  label: string;
  href: string;
};

interface MainNavProps {
  links: readonly NavLink[];
}

export function MainNav({ links }: MainNavProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const navRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Determine active index based on route
  const activeIndex = links.findIndex((link) => {
    if (link.href === "/") {
      return pathname === "/";
    }
    return pathname === link.href || pathname.startsWith(link.href + "/");
  });

  const currentIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

  // Update animated indicator position
  useEffect(() => {
    const updateIndicator = () => {
      if (currentIndex !== -1 && itemsRef.current[currentIndex] && navRef.current) {
        const item = itemsRef.current[currentIndex]!;
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        const left = itemRect.left - navRect.left;
        const width = itemRect.width;

        setIndicatorStyle({
          left,
          width,
          opacity: 1,
        });
      } else if (currentIndex === -1) {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();

    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [currentIndex, pathname]);

  return (
    <nav aria-label="Main" className="relative hidden lg:block">
      <ul
        ref={navRef}
        onMouseLeave={() => setHoveredIndex(null)}
        className="relative flex items-center gap-1 font-nav text-nav"
      >
        {/* Animated Floating Pill Background */}
        <span
          className="pointer-events-none absolute h-9 rounded-full bg-brand-tint/85 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
          aria-hidden="true"
        />

        {links.map((l, index) => {
          const isActive = index === activeIndex;
          const isHovered = index === hoveredIndex;

          return (
            <li key={l.href} className="relative z-10">
              <Link
                href={l.href}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className={`relative flex items-center px-4 py-2 text-[15px] tracking-wide transition-all duration-200 outline-none select-none ${
                  isActive
                    ? "font-semibold text-brand"
                    : isHovered
                      ? "font-medium text-brand"
                      : "text-ink/80 hover:text-ink"
                }`}
              >
                <span>{l.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
