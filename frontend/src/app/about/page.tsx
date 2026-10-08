import type { Metadata } from "next";
import Link from "next/link";

import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { ButtonLink } from "@/components/ui/Button";
import { MediaImage } from "@/components/ui/MediaImage";
import { PageTitle } from "@/components/ui/PageTitle";
import { ShowcaseMedia } from "@/components/ui/ShowcaseMedia";
import { getPage } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const { intro = {} } = await getPage("about");
  return { title: intro.title || "About Us", description: intro.text };
}

type Item = { title: string; text: string; href?: string };

export default async function AboutPage() {
  const { intro = {}, design_led: designLed = {}, solutions = {} } = await getPage("about");
  const items: Item[] = solutions.items ?? [];
  const cta = solutions.cta_card;

  return (
    <>
      <PageTitle title={intro.title || "About Us"} subtitle={intro.subtitle} />

      <section className="container-site grid items-center gap-5 py-6 md:gap-8 md:py-8 lg:grid-cols-[5fr_6fr] lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-feature md:aspect-[685/682]">
          <MediaImage src={intro.image} alt="" sizes="(min-width: 1024px) 40vw, 100vw" preload />
        </div>
        <div>
          <h2 className="font-display text-display font-bold">{intro.heading}</h2>
          {intro.text && <p className="mt-2.5 max-w-[600px] font-display text-subhead md:mt-4">{intro.text}</p>}
          {intro.cta_label && (
            <ButtonLink href={intro.cta_href || "/products"} className="mt-4 font-display md:mt-6">
              {intro.cta_label}
            </ButtonLink>
          )}
        </div>
      </section>

      <section className="container-site section-y text-center">
        {designLed.eyebrow && (
          <p className="font-nav text-[0.625rem] font-semibold tracking-widest text-brand uppercase md:text-sm">
            {designLed.eyebrow}
          </p>
        )}
        <h2 className="mx-auto mt-2 max-w-[760px] font-display text-section font-bold tracking-tight text-ink">
          {designLed.heading}
        </h2>
        <div className="mx-auto mt-3 max-w-[780px] space-y-3 text-center font-sans text-body-lg leading-relaxed text-ink/85 md:mt-6 md:space-y-4">
          {(designLed.paragraphs ?? [designLed.text]).filter(Boolean).map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="mt-6 overflow-hidden rounded-feature shadow-xs md:mt-10">
          <ShowcaseMedia media={designLed} aspectRatio="aspect-[1666/787]" />
        </div>
      </section>

      <section id="solutions" className="container-site section-y scroll-mt-24">
        <div className="text-center">
          {solutions.eyebrow && (
            <p className="font-nav text-[0.625rem] font-semibold tracking-widest text-brand uppercase md:text-sm">
              {solutions.eyebrow}
            </p>
          )}
          <h2 className="mx-auto mt-2 max-w-4xl font-display text-section font-bold tracking-tight text-ink">
            {solutions.heading}
          </h2>
        </div>
        <ul className="mt-5 grid auto-rows-fr grid-cols-2 gap-2.5 md:mt-8 md:gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href || "/products"}
                className="flex h-full min-h-[130px] flex-col justify-center rounded-media border border-ink/80 p-3.5 transition-colors hover:border-brand md:min-h-[200px] md:p-6"
              >
                <h3 className="font-display text-h4 font-semibold">{item.title}</h3>
                <p className="mt-1 font-display text-body leading-snug md:mt-2 md:text-body-lg">{item.text}</p>
              </Link>
            </li>
          ))}
          {cta && (
            <li className="flex min-h-[130px] flex-col items-center justify-center rounded-media bg-brand-tint p-3.5 text-center md:min-h-[200px] md:p-6">
              <h3 className="font-display text-h4 font-semibold text-brand">{cta.title}</h3>
              <p className="mt-1 max-w-[340px] font-display text-body leading-snug md:mt-2 md:text-body-lg">{cta.text}</p>
              <ButtonLink href={cta.href || "/contact"} className="mt-3 font-display md:mt-5">
                {cta.label}
              </ButtonLink>
            </li>
          )}
        </ul>
      </section>

      <ContactFaqSection />
    </>
  );
}
