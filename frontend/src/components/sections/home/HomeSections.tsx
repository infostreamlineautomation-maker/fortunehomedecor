import Image from "next/image";
import Link from "next/link";

import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { MediaImage } from "@/components/ui/MediaImage";
import type { CategoryCard, Sections } from "@/lib/types";

type S = Sections[string];

export { HomeHero } from "./HomeHero";

export function ProductsIntro({ intro, categories }: { intro: S; categories: CategoryCard[] }) {
  return (
    <section className="container-site section-y">
      <div className="flex items-start justify-between gap-4 lg:items-end">
        <div className="max-w-[720px]">
          <h2 className="text-section font-semibold text-brand">{intro.title}</h2>
          <p className="mt-2 hidden text-body-lg text-muted md:mt-3 md:block">{intro.text}</p>
        </div>
        {intro.cta_label && (
          <Link
            href={intro.cta_href || "/products"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-brand py-1.5 pr-1.5 pl-3 text-[0.6875rem] whitespace-nowrap text-white transition-colors hover:bg-brand-strong md:gap-3 md:py-2.5 md:pr-3 md:pl-6 md:text-[0.9375rem]"
          >
            {intro.cta_label}
            <Image src="/icons/circled-arrow.png" alt="" width={26} height={21} className="w-4 rotate-180 md:w-[26px]" style={{ height: "auto" }} />
          </Link>
        )}
      </div>
      <p className="mt-2 text-body-lg text-muted md:hidden">{intro.text}</p>
      <CategoryGrid categories={categories} className="mt-5 md:mt-8" />
    </section>
  );
}

export function WhyChooseUs({ section }: { section: S }) {
  const items: { title: string; text: string }[] = section.items ?? [];
  return (
    <section className="container-site section-y">
      <h2 className="text-section font-semibold text-brand">{section.title}</h2>
      {section.subtitle && <p className="mt-1.5 text-lead text-muted md:mt-2">{section.subtitle}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3 md:mt-8 md:gap-5 lg:grid-cols-3 lg:gap-6">
        {items.map((item) => (
          <FeatureCard key={item.title} title={item.title} text={item.text} />
        ))}
      </div>
    </section>
  );
}

export function ProcessSection({ section }: { section: S }) {
  const steps: { title: string; text: string }[] = section.steps ?? [];
  return (
    <section id="process" className="container-site section-y scroll-mt-24">
      <h2 className="font-display text-section font-medium text-brand">{section.title}</h2>
      {section.subtitle && <p className="mt-2 text-lead text-muted">{section.subtitle}</p>}
      <div className="mt-5 grid overflow-hidden rounded-card bg-brand md:mt-8 lg:grid-cols-2">
        <div className="relative hidden lg:block lg:min-h-0">
          <MediaImage src={section.image} alt="" sizes="(min-width: 1024px) 640px, 100vw" />
        </div>
        <ol className="flex flex-col justify-center gap-4 px-5 py-6 text-white md:gap-6 md:px-10 md:py-8 lg:py-12">
          {steps.map((step, i) => (
            <li key={step.title}>
              <h3 className="text-h4 font-bold capitalize">
                {String(i + 1).padStart(2, "0")} — {step.title}
              </h3>
              <p className="mt-0.5 text-body text-white/90 md:mt-1.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function AboutTeaser({ section }: { section: S }) {
  return (
    <section className="container-site section-y">
      <h2 className="font-display text-section font-medium text-brand">{section.title}</h2>
      <div className="mt-5 grid items-center gap-5 md:mt-8 md:gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="relative aspect-video overflow-hidden rounded-card md:aspect-[862/683]">
          <MediaImage src={section.image} alt="" sizes="(min-width: 1024px) 680px, 100vw" />
        </div>
        <div>
          <h3 className="font-display text-display font-semibold">{section.heading}</h3>
          <p className="mt-3 text-lead md:mt-5">{section.text}</p>
          {section.tagline && <p className="mt-2.5 text-lead font-medium md:mt-4">{section.tagline}</p>}
          {section.cta_label && (
            <ButtonLink href={section.cta_href || "/about"} arrow className="mt-5 font-serif md:mt-7">
              {section.cta_label}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
