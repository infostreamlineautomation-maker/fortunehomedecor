"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { mediaUrl } from "@/lib/media";

type NavLink = { label: string; href: string };

type HeaderActionsProps = {
  links: readonly NavLink[];
  brand?: { name: string; logo: string; tagline?: string };
  contact?: { email?: string; phone?: string; location?: string };
  socials?: Record<string, string>;
  footer?: { copyright?: string; cta_label?: string; cta_href?: string };
};

/** Menu + search icons: opens the slide-in mobile menu and the site-wide search bar. */
export function HeaderActions({ links, brand, contact, socials, footer }: HeaderActionsProps) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"menu" | "search" | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close panel on route change
  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  // Click outside listener for search bar
  useEffect(() => {
    if (panel !== "search") return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(target)
      ) {
        setPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [panel]);

  useEffect(() => {
    if (panel === "search") {
      setTimeout(() => searchInput.current?.focus(), 50);
    }
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    // Stop the page scrolling behind the open menu
    if (panel === "menu") document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [panel]);

  const toggle = (p: "menu" | "search") => {
    setPanel((current) => (current === p ? null : p));
  };

  const menuOpen = panel === "menu";

  return (
    <>
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Inline In-Header Search Bar */}
        {panel === "search" ? (
          <form
            ref={searchContainerRef}
            action="/search"
            role="search"
            className="flex items-center gap-2 rounded-pill border border-brand bg-white px-3 py-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-150 max-w-[200px] sm:max-w-[240px] md:max-w-[280px]"
          >
            <button
              type="submit"
              aria-label="Submit search"
              className="shrink-0 text-brand hover:opacity-80 transition-opacity"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <input
              ref={searchInput}
              type="text"
              name="q"
              required
              placeholder="Search products…"
              aria-label="Search the site"
              className="min-w-0 flex-1 bg-transparent font-alt text-xs md:text-sm text-ink placeholder:text-muted border-0 border-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 shadow-none"
            />
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close search"
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-stone-400 hover:text-ink hover:bg-stone-100 transition-colors"
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        ) : (
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => toggle("search")}
            aria-label="Search"
            aria-expanded={false}
            className="flex size-10 items-center justify-center rounded-xl p-2 text-ink transition-colors hover:bg-brand-tint active:scale-95 touch-manipulation"
          >
            <svg className="size-5 md:size-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => toggle("menu")}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="flex size-10 items-center justify-center rounded-xl p-2 text-ink transition-colors hover:bg-brand-tint active:scale-95 touch-manipulation lg:hidden"
        >
          <svg className="size-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu (Portalled to document.body) */}
      {mounted &&
        createPortal(
          <div className="lg:hidden">
            {/* Dimmed backdrop */}
            <div
              aria-hidden
              onClick={() => setPanel(null)}
              className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
            {/* Slide-in menu drawer */}
            <nav
              aria-label="Mobile navigation"
              aria-hidden={!menuOpen}
              inert={!menuOpen}
              className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between overflow-y-auto bg-brand p-5 text-white shadow-2xl transition-transform duration-300 ease-in-out sm:p-6 ${
                menuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div>
                {/* Top of Menu Bar: Full width Brand Logo */}
                <div className="border-b border-white/15 pb-4">
                  <Link href="/" onClick={() => setPanel(null)} className="block w-full" aria-label="Fortune Decor home">
                    {brand?.logo ? (
                      <div className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3.5 shadow-md">
                        <Image
                          src={mediaUrl(brand.logo)}
                          alt={brand.name || "Fortune Decor"}
                          width={220}
                          height={74}
                          className="h-9 w-auto max-w-[190px] object-contain pointer-events-none select-none"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3.5 shadow-md">
                        <span className="font-display text-base font-bold tracking-wider text-brand uppercase">{brand?.name ?? "Fortune Decor"}</span>
                      </div>
                    )}
                  </Link>
                </div>

                {/* Navigation links */}
                <ul className="mt-5 flex flex-col gap-1.5">
                  {links.map((l) => {
                    const isActive = l.href === "/" ? pathname === "/" : pathname === l.href || pathname.startsWith(l.href + "/");
                    return (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          onClick={() => setPanel(null)}
                          className={`block rounded-xl px-4 py-2.5 font-display text-base font-semibold transition-colors ${
                            isActive ? "bg-white text-brand shadow-sm" : "text-white hover:bg-white/10"
                          }`}
                        >
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Minimal footer at bottom of Menu Bar */}
              <div className="mt-8 border-t border-white/15 pt-5 text-xs text-white/85">
                {/* Social icons row */}
                <div className="flex items-center gap-2.5">
                  <a
                    href={socials?.instagram || "https://instagram.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/15 p-1.5 transition-colors hover:bg-white/25"
                  >
                    <Image src="/icons/instagram-footer.png" alt="Instagram" width={22} height={22} className="size-5 object-contain pointer-events-none" />
                  </a>
                  <a
                    href={socials?.facebook || "https://facebook.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/15 p-1.5 transition-colors hover:bg-white/25"
                  >
                    <Image src="/icons/facebook-footer.png" alt="Facebook" width={22} height={22} className="size-5 object-contain pointer-events-none" />
                  </a>
                  <a
                    href={socials?.linkedin || "https://linkedin.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/15 p-1.5 transition-colors hover:bg-white/25"
                  >
                    <Image src="/icons/linkedin-footer.png" alt="LinkedIn" width={22} height={22} className="size-5 object-contain pointer-events-none" />
                  </a>
                </div>

                <div className="my-3.5 border-t border-white/15" />

                {/* Contact details */}
                <div className="flex flex-col gap-2">
                  {contact?.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                      <svg className="size-4 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact?.phone && (
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                      <svg className="size-4 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>

                <p className="mt-3.5 text-[11px] leading-relaxed text-white/60 font-alt">
                  {footer?.copyright || `© ${new Date().getFullYear()} ${brand?.name || "Fortune Decor"}. All rights reserved.`}
                </p>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
