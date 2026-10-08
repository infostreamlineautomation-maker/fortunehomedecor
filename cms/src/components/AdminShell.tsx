"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";

import { PreviewModal } from "./PreviewModal";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Products", href: "/products" },
  { label: "Pages", href: "/pages" },
  { label: "FAQs", href: "/faqs" },
  { label: "Enquiries", href: "/enquiries" },
  { label: "Media Library", href: "/media" },
  { label: "Settings", href: "/settings" },
  { label: "Users", href: "/users", superadmin: true },
  { label: "Audit Log", href: "/audit-logs", superadmin: true },
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const toast = useToast();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = NAV.filter((n) => !("superadmin" in n) || admin?.role === "superadmin");

  // Determine site path to preview based on CMS route
  let previewPath = "/";
  if (pathname.startsWith("/categories") || pathname.startsWith("/products")) {
    previewPath = "/products";
  } else if (pathname.includes("/about")) {
    previewPath = "/about";
  } else if (pathname.includes("/contact")) {
    previewPath = "/contact";
  }

  const publishLive = async () => {
    setPublishing(true);
    try {
      await adminFetch("/settings/publish", { method: "POST" });
      toast.success("All changes successfully published live to the website!");
    } catch {
      toast.error("Failed to publish changes. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[232px] overflow-y-auto bg-ink-soft text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4">
          <Link href="/" className="mx-auto block w-[150px] rounded-card bg-white p-1.5">
            <Image
              src={mediaUrl("/uploads/figma/brand/logo.png")}
              alt="Fortune Decor"
              width={223}
              height={75}
              style={{ width: "100%", height: "auto" }}
            />
          </Link>
          <p className="mt-2.5 text-center font-alt text-[0.6875rem] tracking-[0.2em] text-line uppercase">Content Manager</p>
        </div>

        <nav aria-label="CMS" className="px-3">
          <ul className="flex flex-col gap-1">
            {items.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`block rounded-card border px-3.5 py-2 font-display text-sm font-medium transition-colors ${
                    isActive(n.href)
                      ? "border-brand-soft bg-brand text-white"
                      : "border-transparent text-line hover:border-glass-line hover:bg-glass"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {menuOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="lg:hidden">
              <Image src="/icons/menu.png" alt="" width={24} height={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-pill bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200/80">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Website Sync</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-sm">
            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 rounded-pill border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-100 hover:border-stone-400 active:scale-95 shadow-xs"
            >
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </button>

            {/* Publish Live Button */}
            <button
              type="button"
              onClick={publishLive}
              disabled={publishing}
              className="flex items-center gap-1.5 rounded-pill bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Publishing…</span>
                </>
              ) : (
                <>
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Publish Live</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-stone-200 mx-0.5 hidden sm:block" />

            <Link href="/profile" className="hidden font-medium hover:text-brand md:inline text-xs" title="Your profile">
              {admin?.full_name || admin?.email}
            </Link>
            <button type="button" onClick={logout} className="rounded-pill border border-ink px-3 py-1 text-xs hover:bg-ink hover:text-white">
              Log out
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 md:p-6">{children}</main>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        siteUrl={SITE_URL}
        initialPath={previewPath}
      />
    </div>
  );
}
