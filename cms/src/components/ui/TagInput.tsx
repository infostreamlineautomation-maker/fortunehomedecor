"use client";

import { useState, type KeyboardEvent } from "react";

/** Chips input for short lists such as "Suitable for" (Enter or comma adds a tag). */
export function TagInput({ value, onChange, placeholder = "Type and press Enter" }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const tag = draft.trim().replace(/,$/, "");
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-white px-2.5 py-2 focus-within:border-brand">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-pill bg-brand-tint px-2.5 py-0.5 text-[0.8125rem] text-brand">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))} className="leading-none hover:text-ink">
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[160px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none"
      />
    </div>
  );
}
