"""Site-wide search over categories, products, FAQs and page content.

Full-text search (English stemming: "curtain" finds "Curtains") plus pg_trgm word similarity,
so small typos ("blnds", "walpaper") still match. Data volume is small, so vectors are built
on the fly; add GIN indexes if the catalogue grows to thousands of rows.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session

PAGE_URLS = {"home": "/", "about": "/about", "contact": "/contact", "products": "/products"}

_SQL = text(
    """
    WITH q AS (
        SELECT websearch_to_tsquery('english', :q) AS tsq, CAST(:q AS text) AS raw, CAST(:pat AS text) AS pat
    ),
    docs AS (
        SELECT 'category' AS kind, c.name AS title, '/products/' || c.slug AS url,
               concat_ws(' ', c.tagline, c.description, c.intro_text) AS body,
               setweight(to_tsvector('english', c.name), 'A')
                 || setweight(to_tsvector('english', concat_ws(' ', c.tagline, c.description, c.intro_text)), 'B') AS vec
        FROM categories c WHERE c.is_active

        UNION ALL
        SELECT 'product', p.name, '/products/' || c.slug || '/' || p.slug,
               concat_ws(' ', p.short_description, p.description),
               setweight(to_tsvector('english', p.name), 'A')
                 || setweight(to_tsvector('english', concat_ws(' ', p.short_description, p.description,
                        c.name, p.suitable_for::text)), 'B')
        FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.is_active AND c.is_active

        UNION ALL
        SELECT 'faq', f.question,
               CASE WHEN c.slug IS NULL THEN '/contact#faqs' ELSE '/products/' || c.slug || '#faqs' END,
               f.answer,
               setweight(to_tsvector('english', f.question), 'A') || setweight(to_tsvector('english', f.answer), 'C')
        FROM faqs f LEFT JOIN categories c ON c.id = f.category_id
        WHERE f.is_active AND (c.id IS NULL OR c.is_active)

        UNION ALL
        SELECT 'page', s.label, s.page, t.body,
               setweight(to_tsvector('english', s.label), 'A') || setweight(to_tsvector('english', t.body), 'C')
        FROM page_sections s
        -- Only human-readable strings from the section JSON (skip image paths and links)
        CROSS JOIN LATERAL (
            SELECT coalesce(string_agg(v #>> '{}', ' '), '') AS body
            FROM jsonb_path_query(s.content, 'strict $.**') AS v
            WHERE jsonb_typeof(v) = 'string' AND left(v #>> '{}', 1) <> '/' AND (v #>> '{}') NOT LIKE 'http%'
        ) t
        WHERE s.is_active
    )
    SELECT kind, title, url,
           ts_headline('english', coalesce(body, ''), q.tsq,
                       'StartSel="", StopSel="", MaxWords=28, MinWords=12, ShortWord=3') AS snippet,
           ts_rank(vec, q.tsq)
             + 0.6 * word_similarity(q.raw, title)
             -- Prefer catalogue pages over FAQs/page text, and titles that start with the query
             + CASE kind WHEN 'category' THEN 0.3 WHEN 'product' THEN 0.25 WHEN 'page' THEN 0.05 ELSE 0 END
             + CASE WHEN title ILIKE q.pat || '%' ESCAPE '\\' THEN 0.3 ELSE 0 END AS score
    FROM docs, q
    WHERE vec @@ q.tsq
       -- 0.4 catches one- or two-letter typos ("blnds" ~ "Blinds" = 0.44); unrelated words score < 0.15
       OR word_similarity(q.raw, title) > 0.4
       OR title ILIKE '%' || q.pat || '%' ESCAPE '\\'
    ORDER BY score DESC, title
    LIMIT :limit
    """
)


def search(db: Session, query: str, limit: int = 30) -> list[dict]:
    query = " ".join(query.split())[:100]
    if len(query) < 2:
        return []
    # Escape LIKE wildcards so "%" or "_" in the query match literally
    pattern = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    rows = db.execute(_SQL, {"q": query, "pat": pattern, "limit": limit}).mappings().all()
    return [
        {
            "kind": r["kind"],
            "title": r["title"],
            "url": PAGE_URLS.get(r["url"], "/") if r["kind"] == "page" else r["url"],
            "snippet": r["snippet"],
            "score": round(float(r["score"]), 4),
        }
        for r in rows
    ]
