import Image from "next/image";
import Link from "next/link";

import { EnquiryButton } from "@/components/enquiry/EnquiryButton";
import { MediaImage } from "@/components/ui/MediaImage";
import { ProductMediaGallery } from "./ProductMediaGallery";
import type { CategoryCard, CategoryDetail, Product } from "@/lib/types";

const num = (i: number) => String(i + 1).padStart(2, "0");

function EnquiryActions({ subject, categorySlug, productSlug }: { subject: string; categorySlug: string; productSlug?: string }) {
  return (
    <div className="mt-4 flex gap-2.5 md:mt-6 md:gap-3">
      <EnquiryButton type="quote" variant="outline" subject={subject} categorySlug={categorySlug} productSlug={productSlug} className="flex-1 md:flex-none md:min-w-[170px]" />
      <EnquiryButton type="sample" subject={subject} categorySlug={categorySlug} productSlug={productSlug} className="flex-1 md:flex-none md:min-w-[170px]" />
    </div>
  );
}

/** "Designed for Modern Projects" — intro text, enquiry buttons and image. */
export function CategoryIntro({ category }: { category: CategoryDetail }) {
  return (
    <section className="container-site grid items-center gap-5 py-6 md:gap-8 md:py-8 lg:grid-cols-2 lg:gap-14">
      <div>
        <h2 className="font-display text-display font-bold">{category.intro_title || category.name}</h2>
        {category.intro_text && <p className="mt-2.5 max-w-[560px] font-display text-subhead md:mt-4">{category.intro_text}</p>}
        <EnquiryActions subject={category.name} categorySlug={category.slug} />
      </div>
      <div className="relative aspect-[4/3] md:aspect-[6/5] overflow-hidden rounded-feature">
        <MediaImage src={category.hero_image} alt={category.name} sizes="(min-width: 1024px) 50vw, 100vw" preload />
      </div>
    </section>
  );
}

/** Image + numbered list of the category's product types, each linking to its block on the types page. */
export function TypesList({ category }: { category: CategoryDetail }) {
  if (category.products.length === 0) return null;
  return (
    <section className="container-site grid items-center gap-5 py-6 md:gap-8 md:py-8 lg:grid-cols-2 lg:gap-14">
      <div className="relative order-2 aspect-[4/3] md:aspect-[6/5] overflow-hidden rounded-feature lg:order-1">
        <MediaImage src={category.types_image || category.card_image} alt="" sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
      <div className="order-1 lg:order-2">
        <h2 className="font-display text-display font-semibold">{category.types_heading || `${category.name} Types`}</h2>
        <ul className="mt-2 md:mt-4">
          {category.products.map((p, i) => (
            <li key={p.slug} className="border-b border-ink last:border-b-0">
              <Link
                href={`/products/${category.slug}/types#${p.slug}`}
                className="group flex items-center justify-between gap-4 py-2.5 font-display text-h5 transition-colors hover:text-brand md:py-3.5"
              >
                <span>
                  {num(i)} — {p.name}
                </span>
                <Image
                  src="/icons/down-left-arrow.png"
                  alt=""
                  width={41}
                  height={50}
                  className="size-4 rotate-180 object-contain md:size-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null;
  return (
    <section className="container-site grid grid-cols-3 gap-2 py-6 md:gap-5 md:py-8">
      {images.map((src, i) => (
        <div key={src} className="relative aspect-square overflow-hidden rounded-feature md:aspect-[541/496]">
          <MediaImage src={src} alt={`${alt} ${i + 1}`} sizes="(min-width: 1024px) 420px, 33vw" />
        </div>
      ))}
    </section>
  );
}

/** One alternating block on the types page ("01 — Sheer Curtains"). */
export function ProductBlock({ product, index, categorySlug }: { product: Product; index: number; categorySlug: string }) {
  const imageFirst = index % 2 === 1;
  const allImages = [
    ...(product.cover_image ? [product.cover_image] : []),
    ...(product.images || []).filter((img) => img && img !== product.cover_image),
  ];

  return (
    <section id={product.slug} className="container-site grid scroll-mt-20 items-center gap-5 py-6 md:scroll-mt-24 md:gap-8 md:py-8 lg:grid-cols-2 lg:gap-14">
      <div className={imageFirst ? "lg:order-2" : ""}>
        <h2 className="font-display text-display font-bold">
          {num(index)} — {product.name}
        </h2>
        {(product.description || product.short_description) && (
          <p className="mt-2.5 max-w-[560px] font-display text-subhead md:mt-4">{product.description || product.short_description}</p>
        )}
        {product.suitable_for && product.suitable_for.length > 0 && (
          <p className="mt-2.5 font-display text-subhead md:mt-4">
            <strong className="font-bold">Suitable for :</strong> {product.suitable_for.join(" · ")}
          </p>
        )}
        <EnquiryActions subject={product.name} categorySlug={categorySlug} productSlug={product.slug} />
      </div>
      <div className={imageFirst ? "lg:order-1" : ""}>
        <ProductMediaGallery images={allImages} productName={product.name} preload={index === 0} />
      </div>
    </section>
  );
}

export function ExploreMore({ categories }: { categories: CategoryCard[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container-site section-y">
      <h2 className="font-display text-section font-medium">Explore More</h2>
      <ul className="mt-4 grid grid-cols-3 gap-2.5 md:mt-6 md:gap-6">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/products/${c.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-feature md:aspect-[541/496]">
                <MediaImage
                  src={c.card_image}
                  alt={c.name}
                  sizes="(min-width: 1024px) 420px, 33vw"
                  className="transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-1.5 text-[0.6875rem] leading-tight font-medium md:mt-3 md:text-title">{c.name} →</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
