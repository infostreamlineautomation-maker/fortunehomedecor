"use client";

import { ImageField } from "@/components/media/ImageField";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/Form";
import { move } from "@/components/ui/SortableList";
import type { JsonObject, JsonValue } from "@/lib/types";

/**
 * Form editor for a page section's free-form JSON. The shape comes from the seeded content
 * (backend/app/seed_data.py): editors change values and add/remove list items, not keys.
 */

const LABELS: Record<string, string> = {
  cta_label: "Button text",
  cta_href: "Button link",
  label: "Button text",
  href: "Link",
  alt: "Image description (alt text)",
  eyebrow: "Small heading above",
  embed_url: "Google Maps embed URL",
  submit_label: "Submit button text",
  cta_card: "Call-to-action card",
};

const LONG_TEXT_KEYS = new Set(["text", "description", "subtitle", "answer", "tagline"]);

function humanize(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const isImageKey = (key: string) => key === "image" || key.endsWith("_image") || key === "images";

/** An empty value with the same shape, used when adding a list item. */
function blankLike(value: JsonValue): JsonValue {
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blankLike(v)]));
  return null;
}

function itemTitle(item: JsonValue, index: number): string {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const t = item.title ?? item.question ?? item.label;
    if (typeof t === "string" && t) return `${index + 1}. ${t}`;
  }
  return `Item ${index + 1}`;
}

function ValueEditor({ name, value, onChange }: { name: string; value: JsonValue; onChange: (v: JsonValue) => void }) {
  const label = humanize(name);

  if (typeof value === "boolean") return <Toggle checked={value} onChange={onChange} label={label} />;
  if (typeof value === "number")
    return (
      <Field label={label}>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </Field>
    );

  if (typeof value === "string" || value === null) {
    const text = value ?? "";
    if (isImageKey(name)) return <ImageField label={label} value={text || null} onChange={(url) => onChange(url ?? "")} />;
    const long = LONG_TEXT_KEYS.has(name) || name.startsWith("paragraph") || text.length > 90;
    return (
      <Field label={label} hint={name.endsWith("href") ? "A page on this site, e.g. /contact or /products/curtains" : undefined}>
        {long ? <Textarea rows={Math.min(8, Math.max(3, Math.ceil(text.length / 90)))} value={text} onChange={(e) => onChange(e.target.value)} /> : <Input value={text} onChange={(e) => onChange(e.target.value)} />}
      </Field>
    );
  }

  if (Array.isArray(value)) return <ListEditor name={name} value={value} onChange={onChange} />;

  return (
    <fieldset className="rounded-card border border-line p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <ObjectFields value={value} onChange={onChange} />
    </fieldset>
  );
}

function ListEditor({ name, value, onChange }: { name: string; value: JsonValue[]; onChange: (v: JsonValue) => void }) {
  const template: JsonValue = value.length > 0 ? blankLike(value[0]) : "";
  const update = (i: number, v: JsonValue) => onChange(value.map((x, j) => (j === i ? v : x)));
  const singular = humanize(name).replace(/s$/, "");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{humanize(name)}</p>
        <Button size="sm" variant="secondary" onClick={() => onChange([...value, template])}>
          Add {singular.toLowerCase()}
        </Button>
      </div>
      <ol className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="rounded-card border border-line bg-cream/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted">{itemTitle(item, i)}</span>
              <div className="flex items-center gap-1 text-sm">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))} className="px-1.5 disabled:opacity-30">
                  ▲
                </button>
                <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))} className="px-1.5 disabled:opacity-30">
                  ▼
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-2 text-brand hover:underline">
                  Remove
                </button>
              </div>
            </div>
            {item && typeof item === "object" && !Array.isArray(item) ? (
              <ObjectFields value={item} onChange={(v) => update(i, v)} />
            ) : (
              <ValueEditor name={name === "paragraphs" ? "paragraph" : singular.toLowerCase()} value={item} onChange={(v) => update(i, v)} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// Postgres JSONB doesn't keep key order, so fields are shown in natural reading order instead
const KEY_ORDER = [
  "eyebrow",
  "title",
  "heading",
  "question",
  "subtitle",
  "text",
  "answer",
  "paragraphs",
  "tagline",
  "image",
  "alt",
  "items",
  "steps",
  "cta_label",
  "cta_href",
  "label",
  "href",
  "submit_label",
  "embed_url",
  "cta_card",
];
const rank = (key: string) => {
  const i = KEY_ORDER.indexOf(key);
  return i === -1 ? KEY_ORDER.length : i;
};

function ObjectFields({ value, onChange }: { value: JsonObject; onChange: (v: JsonObject) => void }) {
  const entries = Object.entries(value).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
  return (
    <div className="space-y-4">
      {entries.map(([key, v]) => (
        <ValueEditor key={key} name={key} value={v} onChange={(next) => onChange({ ...value, [key]: next })} />
      ))}
    </div>
  );
}

export function JsonContentEditor({ value, onChange }: { value: JsonObject; onChange: (v: JsonObject) => void }) {
  return <ObjectFields value={value} onChange={onChange} />;
}
