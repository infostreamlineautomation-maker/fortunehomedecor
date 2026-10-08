# Fortune Decor — Project Plan

Website + CMS for **Fortune Decor** ("Designed for Every Surface") — curtains, blinds, wallpapers,
stretch ceilings and architectural solutions. Same architecture as Meewa Industries, cleaned up.

Figma: `All-prjects` → node `77:2` (6 frames: Home, Products, Curtain category, Curtain sub-page,
About Us, Contact).

---

## 1. Architecture

| Service    | Tech                      | Dev port | Prod (behind Nginx)       | Folder      |
|------------|---------------------------|----------|---------------------------|-------------|
| Website    | Next.js 16 (App Router)   | 3000     | `example.com`             | `frontend/` |
| CMS        | Next.js 16 (App Router)   | 3001     | `admin.example.com`       | `cms/`      |
| Public API | FastAPI (`app.main`)      | 8000     | `api.example.com`         | `backend/`  |
| Admin API  | FastAPI (`app.admin_main`)| 8001     | `admin-api.example.com`   | `backend/`  |
| Database   | PostgreSQL + Alembic      | 5432     | local on VPS              | —           |

- One backend codebase, **two FastAPI apps** sharing models/DB. The public API is read-only
  (plus enquiry submit, rate limited); the admin API holds every write route behind JWT auth.
  The website and CMS never share a port, origin or CORS list.
- Media: uploaded to `backend/uploads/`, served by Nginx directly in production.
- Production: Hostinger VPS (Ubuntu), PM2 runs all 4 processes (`deploy/ecosystem.config.js`),
  Nginx reverse proxy + Certbot SSL (`deploy/nginx/fortunedecor.conf`).

```
HomeDecor/
├── backend/
│   ├── app/
│   │   ├── core/        config.py, database.py, security.py
│   │   ├── models/      SQLAlchemy 2.0 models (import each in models/__init__.py)
│   │   ├── schemas/     Pydantic schemas
│   │   ├── routers/
│   │   │   ├── public/  read endpoints for the website
│   │   │   └── admin/   CMS endpoints (auth.py done)
│   │   ├── services/    storage, email, audit (to add)
│   │   ├── deps.py      get_current_admin
│   │   ├── cli.py       python -m app.cli create-admin
│   │   ├── main.py      public API  (:8000)
│   │   └── admin_main.py admin API  (:8001)
│   ├── alembic/         migrations (reads DATABASE_URL from backend/.env)
│   ├── uploads/
│   ├── requirements.txt
│   └── .env.example
├── frontend/            website (Next.js)
├── cms/                 CMS (Next.js)
├── deploy/              ecosystem.config.js (PM2), nginx/fortunedecor.conf
├── scripts/             script.sh/.bat (setup), run.sh/.bat (run)
└── docs/                PLAN.md, DEPLOYMENT.md
```

---

## 2. Website pages (from Figma)

| Route                          | Sections                                                                                         |
|--------------------------------|--------------------------------------------------------------------------------------------------|
| `/`                            | Hero (full-bleed image) · Our Products grid · Why Choose Us (6 cards) · Process (5 steps, red panel) · About teaser · Get in Touch + FAQs · Footer |
| `/products`                    | Hero banner "Perfect Curtains Complete Your Home's Aesthetic" · category grid · Get in Touch + FAQs |
| `/products/[category]`         | e.g. Curtain: intro + CTA (Request Quote / Request Samples) · "Curtain Types" numbered list · image gallery · FAQs |
| `/products/[category]/[type]`  | Alternating image/text blocks per type (01 Sheer, 02 Dimout, 03 Blackout…) with "Suitable for", CTAs · Explore More · FAQs |
| `/about`                       | Creating Better Spaces · Design-Led Solutions · Solutions grid (Curtains & Blinds, Wallpapers, Stretch Ceiling, Fabrics, Architectural) · CTA card · FAQs |
| `/contact`                     | "We're Here to Help" hero · phone/email/address · enquiry form · map · social links |
| `/privacy`, `/terms`, `/cookies`, `/sitemap.xml`, `robots.txt` | Footer links + SEO |

Shared: Header (logo, nav: Home / Products ▾ / About / Contact, search, menu), red Footer
(Collections, Company, Connect, newsletter/"Book Free Consult" CTA), Get-in-Touch dark card,
FAQ accordion, Quote/Sample request modal.

Rendering: server components fetching the public API with ISR (`revalidate`) + on-demand
revalidation hook called by the admin API when content is published.

---

## 3. Data model (Postgres, via Alembic)

| Table            | Key fields |
|------------------|-----------|
| `admin_users` ✅ | email, full_name, password_hash, role (superadmin/editor), is_active, last_login_at |
| `categories`     | name, slug, tagline, description, hero_image, card_image, sequence, is_active, SEO (meta_title, meta_description, og_image) |
| `products`       | category_id, name, slug, number_label ("01"), short_desc, description, suitable_for[], images[], sequence, is_active, show_in_explore, SEO |
| `faqs`           | question, answer, scope (global / category_id), sequence, is_active |
| `page_sections`  | page (home/about/contact/products), key (hero, why_choose_us, process…), content JSONB, sequence, is_active — drives editable page blocks |
| `site_settings`  | key/value JSONB: contact info, socials, footer text, map embed, SEO defaults, logo |
| `enquiries`      | type (contact / quote / sample), name, email, phone, company, city, message, product_id, category_id, status (new/in_progress/closed), notes, source_page, ip |
| `media`          | filename, url, mime, size, width, height, alt_text, uploaded_by |
| `audit_logs`     | admin_id, action, entity, entity_id, diff JSONB, created_at |

---

## 4. CMS (same theme as website)

Same brand tokens (red primary, white surfaces, charcoal dark cards, same font) shared via a
`theme.css` copied into both apps.

| CMS page          | Does |
|-------------------|------|
| Login             | Email + password → httpOnly cookie (`/auth/login`) |
| Dashboard         | Counts (enquiries new/total, products, categories), latest enquiries |
| Categories        | CRUD, drag-sort, images, SEO, active toggle |
| Products / Types  | CRUD per category, gallery upload, "Suitable for" tags, drag-sort |
| Pages             | Edit Home / About / Contact / Products sections (hero, Why Choose Us, Process, solutions…) |
| FAQs              | CRUD, global vs per-category, sort |
| Enquiries         | List/filter (type, status, date), detail, status + notes, CSV export |
| Media Library     | Upload, alt text, reuse, delete (guards in-use files) |
| Settings          | Contact details, socials, footer, SEO defaults, logo |
| Users             | Superadmin manages editors |
| Audit Log         | Who changed what |
| Profile           | Change password |

---

## 5. Backend API

Public (`:8000`, GET only except enquiries):
`/health` ✅ · `/settings` · `/pages/{page}` · `/categories` · `/categories/{slug}` ·
`/categories/{slug}/products` · `/products/{slug}` · `/faqs?scope=` · `POST /enquiries` (rate limited, honeypot, email notify)

Admin (`:8001`, JWT required except login):
`/auth/login|logout|me` ✅ · CRUD `/categories` `/products` `/faqs` `/pages` `/settings` `/media` `/users` ·
`/enquiries` (+ CSV) · `/dashboard` · `/audit-logs` · `PATCH .../reorder`

Security: bcrypt passwords, JWT in httpOnly cookie, CORS split per app, upload type/size checks,
Pillow re-encode + WebP thumbnails, slowapi rate limits, docs disabled in production.

---

## 6. Phases

1. **Setup** ✅ — folder structure, both Next apps, FastAPI skeleton (2 apps), config/DB/auth,
   Alembic + first migration, setup/run scripts (Windows + Linux), PM2 + Nginx templates.
2. **Design system** ✅ — tokens/fonts from Figma in `src/styles/theme.css` (identical in both apps);
   website Header (mobile menu + search overlay), Footer, buttons, section heading, feature card,
   FAQ accordion, Get-in-Touch card (`/styleguide` previews them); CMS login (working against the
   admin API), auth guard and sidebar shell. Home-page images in `backend/uploads/figma/{brand,home,categories}`;
   originals from the other pages are in `uploads/figma/_raw/` and get sorted into named folders in phase 4.
3. **Backend models + APIs** ✅ — all tables (migration `442b69683728`, adds `pg_trgm`), public + admin
   routers (see `/docs` on :8000 and :8001), media upload (content-checked, EXIF stripped, in-use guard),
   site-wide search, enquiries (honeypot, rate limit, SMTP notification), audit log, user management,
   CSV export, `python -m app.seed` (idempotent, runs on every setup/deploy). 25 pytest tests.
4. **Website pages** ✅ — Home, Products, `/products/[category]`, `/products/[category]/types`
   (product URLs redirect to their block there), About, Contact, Search, policy placeholders, 404,
   sitemap/robots. All content from the API via `'use cache'` + tags; CMS edits refresh pages through
   `/api/revalidate`. Quote/Sample dialogs and contact form post enquiries. Responsive down to 375px.
5. **CMS** ✅ — Dashboard, Categories, Products (drag reorder, image/gallery pickers, tags, SEO),
   Pages (form editor generated from each section's JSON), FAQs (general + per category),
   Enquiries (filters, detail, notes, CSV), Media Library (drag-drop upload, alt text, in-use guard),
   Settings, Users, Audit Log, Profile. Unsaved-change warnings, toasts, confirm dialogs.
6. **Enquiries & email** — forms → DB → email notification; CMS inbox.
7. **QA & deploy** — Lighthouse/SEO, mobile pass, deploy to Hostinger per `DEPLOYMENT.md`.

## 7. Decisions

- **Search (header icon):** site-wide. `GET /search?q=` on the public API searches categories,
  products/types, FAQs and page content (Postgres full-text `tsvector` + trigram fallback for typos),
  and returns grouped results with links. The website gets a search overlay plus a `/search` results page.
- **Images:** use the Figma images, no stock/default placeholders. They are exported from Figma into
  `backend/uploads/` (local disk), registered in the `media` table, and referenced by `/uploads/...`
  URLs in the seed data. Everything uploaded later from the CMS goes to the same folder.
- **Email:** sent over SMTP; host, port, login and from/to addresses are configured in `backend/.env`
  (`SMTP_*` keys), so the mailbox provider can be changed without code changes.

## 8. Open questions

- Final domain name(s) and whether admin/API live on subdomains (assumed) or paths.
- Which mailbox sends enquiry emails (see `SMTP_*` in `backend/.env.example`) and who receives them.
- Newsletter/"Book Free Consult" in footer: just an enquiry, or a mailing-list integration?
