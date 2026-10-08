// Shapes returned by the admin API (backend/app/schemas)

export type Page<T> = { items: T[]; total: number; page: number; page_size: number };

type Seo = { meta_title: string | null; meta_description: string | null; og_image: string | null };

export type Category = Seo & {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  intro_title: string | null;
  intro_text: string | null;
  types_heading: string | null;
  card_image: string | null;
  hero_image: string | null;
  types_image: string | null;
  gallery: string[];
  is_active: boolean;
  sequence: number;
  product_count: number;
  created_at: string;
  updated_at: string;
};

export type Product = Seo & {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  suitable_for: string[];
  cover_image: string | null;
  images: string[];
  is_active: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
};

export type Faq = {
  id: number;
  question: string;
  answer: string;
  category_id: number | null;
  sequence: number;
  is_active: boolean;
  updated_at: string;
};

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type PageSection = {
  id: number;
  page: string;
  key: string;
  label: string;
  content: JsonObject;
  sequence: number;
  is_active: boolean;
  updated_at: string;
};

export type Media = {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  folder: string;
  created_at: string;
};

export type EnquiryType = "contact" | "quote" | "sample";
export type EnquiryStatus = "new" | "in_progress" | "closed";

export type Enquiry = {
  id: number;
  type: EnquiryType;
  status: EnquiryStatus;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  city: string | null;
  message: string | null;
  category_id: number | null;
  product_id: number | null;
  category_name: string | null;
  product_name: string | null;
  notes: string | null;
  source_page: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: "superadmin" | "editor";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type AuditEntry = {
  id: number;
  admin_id: number | null;
  admin_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type Dashboard = {
  categories: number;
  products: number;
  faqs: number;
  media: number;
  enquiries_total: number;
  enquiries_new: number;
  enquiries_by_type: Record<EnquiryType, number>;
  latest_enquiries: { id: number; name: string; type: EnquiryType; status: EnquiryStatus; created_at: string }[];
};

export type Settings = Record<"brand" | "contact" | "socials" | "footer" | "seo", Record<string, string>>;
