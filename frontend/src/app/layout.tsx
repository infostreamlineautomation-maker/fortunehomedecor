import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSettings } from "@/lib/api";
import { fontVariables } from "@/lib/fonts";
import { mediaUrl } from "@/lib/media";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { brand, seo } = await getSettings();
  const iconUrl = brand.logo ? mediaUrl(brand.logo) : "/icon.png";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: seo.default_title || brand.name, template: `%s | ${brand.name}` },
    description: seo.default_description || brand.description,
    icons: {
      icon: [
        { url: iconUrl },
        { url: "/icon.png", type: "image/png" },
        { url: "/favicon.ico" },
      ],
      shortcut: iconUrl,
      apple: iconUrl,
    },
    openGraph: {
      siteName: brand.name,
      type: "website",
      images: seo.og_image ? [mediaUrl(seo.og_image)] : (brand.logo ? [mediaUrl(brand.logo)] : undefined),
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
