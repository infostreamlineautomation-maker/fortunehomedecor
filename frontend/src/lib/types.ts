// Shapes returned by the public API (backend/app/schemas/content.py)

export type Faq = { id?: number; question: string; answer: string };

export type CategoryCard = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  card_image: string | null;
};

type Seo = { meta_title: string | null; meta_description: string | null; og_image: string | null };

export type Product = Seo & {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  suitable_for: string[];
  cover_image: string | null;
  images: string[];
};

export type CategoryDetail = CategoryCard &
  Seo & {
    description: string | null;
    intro_title: string | null;
    intro_text: string | null;
    types_heading: string | null;
    hero_image: string | null;
    types_image: string | null;
    gallery: string[];
    products: Product[];
    faqs: Faq[];
  };

export type ProductDetail = Product & { category: CategoryCard };

export type SearchResult = { kind: "category" | "product" | "faq" | "page"; title: string; url: string; snippet: string };

export type Settings = {
  brand: { name: string; logo: string; tagline: string; description: string };
  contact: {
    email: string;
    phone: string;
    whatsapp?: string;
    address: string;
    location: string;
    hours?: string;
    map_embed_url?: string;
  };
  socials: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string };
  footer: { copyright: string; cta_label: string; cta_href: string };
  seo: { default_title: string; default_description: string; og_image?: string };
};

/** Page sections are free-form JSON edited in the CMS; each page component reads the keys it knows. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Sections = Record<string, Record<string, any>>;
