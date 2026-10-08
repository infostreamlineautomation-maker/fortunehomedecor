import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryIntro, Gallery, TypesList } from "@/components/sections/category/CategorySections";
import { ContactFaqSection } from "@/components/sections/ContactFaqSection";
import { PageTitle } from "@/components/ui/PageTitle";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { getCategory } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { categoryParams } from "@/lib/params";

export const generateStaticParams = categoryParams;

export async function generateMetadata({ params }: PageProps<"/products/[category]">): Promise<Metadata> {
  const category = await getCategory((await params).category);
  if (!category) return {};
  const image = category.og_image || category.hero_image || category.card_image;
  return {
    title: category.meta_title || category.name,
    description: category.meta_description || category.description || undefined,
    openGraph: image ? { images: [mediaUrl(image)] } : undefined,
  };
}

async function CategoryView({ params }: Pick<PageProps<"/products/[category]">, "params">) {
  const category = await getCategory((await params).category);
  if (!category) notFound();

  return (
    <>
      <PageTitle title={category.name} subtitle={category.description} />
      <CategoryIntro category={category} />
      <TypesList category={category} />
      <Gallery images={category.gallery} alt={category.name} />
      <ContactFaqSection faqs={category.faqs} />
    </>
  );
}

export default function CategoryPage({ params }: PageProps<"/products/[category]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryView params={params} />
    </Suspense>
  );
}
