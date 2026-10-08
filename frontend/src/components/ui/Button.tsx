import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "brand" | "light" | "outline";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  brand: "bg-brand text-white hover:bg-brand-strong",
  light: "bg-cream text-ink hover:bg-white",
  outline: "border border-ink text-ink hover:bg-ink hover:text-white",
};

// Compact on phones (Meewa-style 12px pills), regular from md up
const SIZES: Record<Size, string> = {
  md: "px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-[0.9375rem]",
  lg: "px-5 py-2.5 text-sm md:px-7 md:py-3 md:text-base",
};

const BASE = "inline-flex items-center justify-center gap-2 md:gap-2.5 rounded-pill transition-colors duration-200 disabled:opacity-60";

export function buttonClasses(variant: Variant = "brand", className = "", size: Size = "md") {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; arrow?: boolean };

/** Pill link button from the design ("View all products ⟶", "About Us →", "Start Your Project →"). */
export function ButtonLink({ variant = "brand", size = "md", arrow = false, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, className, size)} {...props}>
      {children}
      {arrow && <span aria-hidden>→</span>}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "brand", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className, size)} {...props} />;
}
