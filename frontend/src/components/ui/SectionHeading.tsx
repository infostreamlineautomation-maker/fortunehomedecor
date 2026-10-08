import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
};

/** Red section title + grey subtitle ("Why Choose Us / Thoughtful Design. Reliable Execution."). */
export function SectionHeading({ title, subtitle, align = "left", className = "", as: Tag = "h2" }: Props) {
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <Tag className="font-display text-section font-medium text-brand">{title}</Tag>
      {subtitle && <p className="mt-2 text-lead text-muted">{subtitle}</p>}
    </div>
  );
}
