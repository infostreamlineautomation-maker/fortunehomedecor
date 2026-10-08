import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExploreMore, ProductBlock } from "@/components/sections/category/CategorySections";
import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { PageTitle } from "@/components/ui/PageTitle";
import { ScrollToHash } from "@/components/ui/ScrollToHash";
import { getCategories, getCategory } from "@/lib/api";
import { categoryParams } from "@/lib/params";

export const generateStaticParams = categoryParams;

export async function generateMetadata({ params }: PageProps<"/products/[category]/types">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) return {};
  return {
    title: category.types_heading || `${category.name} Types`,
    description: category.tagline || category.description || undefined,
  };
}

async function TypesView({ params }: Pick<PageProps<"/products/[category]/types">, "params">) {
  const slug = (await params).category;
  const [category, all] = await Promise.all([getCategory(slug), getCategories()]);
  if (!category || category.products.length === 0) notFound();

  return (
    <>
      <PageTitle title={category.name} subtitle={category.tagline || category.description} />
      {category.products.map((product, i) => (
        <ProductBlock key={product.slug} product={product} index={i} categorySlug={category.slug} />
      ))}
      <ExploreMore categories={all.filter((c) => c.slug !== slug).slice(0, 3)} />
      <ContactFaqSection faqs={category.faqs} />
      <ScrollToHash />
    </>
  );
}

export default function CategoryTypesPage({ params }: PageProps<"/products/[category]/types">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TypesView params={params} />
    </Suspense>
  );
}
