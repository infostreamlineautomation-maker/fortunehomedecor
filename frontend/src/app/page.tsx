import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { AboutTeaser, HomeHero, ProcessSection, ProductsIntro, WhyChooseUs } from "@/components/sections/home/HomeSections";
import { getCategories, getPage } from "@/lib/api";

export default async function HomePage() {
  const [page, categories] = await Promise.all([getPage("home"), getCategories()]);

  return (
    <>
      {page.hero && <HomeHero hero={page.hero} />}
      {page.products_intro && <ProductsIntro intro={page.products_intro} categories={categories} />}
      {page.why_choose_us && <WhyChooseUs section={page.why_choose_us} />}
      {page.process && <ProcessSection section={page.process} />}
      {page.about && <AboutTeaser section={page.about} />}
      <ContactFaqSection />
    </>
  );
}
