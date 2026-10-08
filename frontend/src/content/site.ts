/** Static navigation. Brand, contact details, socials and FAQs come from the CMS (lib/api.ts). */

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Our Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Projects", href: "/about#solutions" },
  { label: "Our Process", href: "/#process" },
  { label: "Contact", href: "/contact" },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Shipping & Returns", href: "/shipping" },
] as const;

export const SOCIAL_KEYS = ["instagram", "facebook", "linkedin", "youtube"] as const;
