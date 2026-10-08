import type { Metadata } from "next";

import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Style guide", robots: { index: false } };

const SWATCHES = [
  ["brand", "#9e1515", "bg-brand"],
  ["brand-strong", "#bb1e23", "bg-brand-strong"],
  ["brand-soft", "#b62f2f", "bg-brand-soft"],
  ["ink-soft", "#1e1e1e", "bg-ink-soft"],
  ["muted", "#7d7d7d", "bg-muted"],
  ["line", "#d9d9d9", "bg-line"],
  ["stone", "#cec9c9", "bg-stone"],
  ["cream", "#fffcfc", "bg-cream"],
] as const;

const FEATURES = [
  ["Curated Collection", "A carefully selected range of fabrics, textures, patterns, systems and finishes for contemporary interiors."],
  ["Made for Your Space", "Every project is different. We work around your dimensions, design language, functionality and project requirements."],
  ["Design + Function", "Our solutions aren't only about aesthetics. We consider light, privacy, comfort, acoustics, durability and everyday usability."],
] as const;

/** Internal page showing the shared design tokens and components. */
export default function StyleguidePage() {
  return (
    <>
      <div className="container-site space-y-16 py-16">
        <SectionHeading as="h1" title="Style guide" subtitle="Fortune Decor tokens and components, taken from Figma." />

        <section className="space-y-4">
          <h2 className="text-title font-semibold">Colours</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SWATCHES.map(([name, hex, cls]) => (
              <div key={name} className="overflow-hidden rounded-card border border-line">
                <div className={`h-20 ${cls}`} />
                <p className="px-3 py-2 text-sm">
                  <strong>{name}</strong> <span className="text-muted">{hex}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-title font-semibold">Type</h2>
          <p className="font-display text-hero font-bold">Display / hero — Google Sans Flex</p>
          <p className="font-display text-section font-medium text-brand">Section title — Our Products</p>
          <p className="text-lead text-muted">Lead — Thoughtful Design. Reliable Execution. Complete Solutions.</p>
          <p className="text-body-lg">Body large — Inter. From windows to walls and ceilings, our curated collection brings together design, comfort and function.</p>
          <p className="font-alt text-body text-ink-soft">Body — Instrument Sans. Every project is different.</p>
          <p className="font-serif text-lead">Serif accent — Playfair Display</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-title font-semibold">Buttons</h2>
          <div className="flex flex-wrap items-center gap-4 rounded-card bg-brand p-6">
            <ButtonLink href="/products" arrow>
              View all products
            </ButtonLink>
            <ButtonLink href="/contact" variant="light" arrow className="font-serif">
              Start Your Project
            </ButtonLink>
            <Button variant="outline" className="bg-white">
              Request a Quote
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading title="Why Choose Us" subtitle="Thoughtful Design. Reliable Execution. Complete Solutions." />
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(([title, text]) => (
              <FeatureCard key={title} title={title} text={text} />
            ))}
          </div>
        </section>
      </div>

      <ContactFaqSection />
    </>
  );
}
