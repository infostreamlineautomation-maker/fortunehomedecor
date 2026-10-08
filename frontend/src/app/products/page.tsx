import type { Metadata } from "next";

import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { HomeHero } from "@/components/sections/home/HomeHero";
import { getCategories, getPage } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("products");
  return { title: page.intro?.title || "Our Products", description: page.intro?.text };
}

export default async function ProductsPage() {
  const [page, categories] = await Promise.all([getPage("products"), getCategories()]);
  const { hero = {}, intro = {} } = page;

  return (
    <>
      {(hero.image || hero.video_url || (hero.slides && hero.slides.length > 0)) && (
        <HomeHero hero={hero} className="h-[clamp(150px,35vw,480px)]" />
      )}
      <section className="container-site section-y text-center">
        <h1 className="text-section font-semibold text-brand">{intro.title || "Our Products"}</h1>
        {intro.text && <p className="mx-auto mt-3 max-w-[720px] text-body-lg text-muted">{intro.text}</p>}
        <CategoryGrid categories={categories} className="mt-10 text-left" />
      </section>
      <ContactFaqSection />
    </>
  );
}
