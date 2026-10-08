import type { ComponentProps, ReactNode } from "react";

const CONTROL =
  "w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand disabled:bg-cream";

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[0.8125rem] font-medium">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-brand">{error}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${CONTROL} ${className}`} {...props} />;
}

export function Textarea({ className = "", rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={`${CONTROL} resize-y ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${CONTROL} ${className}`} {...props} />;
}

/** On/off switch (e.g. "Visible on website"). */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 left-0 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}

/** Text helper for nullable string fields: empty input -> null. */
export const orNull = (v: string) => (v.trim() === "" ? null : v);
