import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { getProduct } from "@/lib/api";
import { PLACEHOLDER } from "@/lib/params";

// Products are presented together on /products/<category>/types; individual product URLs
// (search results, shared links) redirect to their block on that page.

export function generateStaticParams() {
  return [{ category: PLACEHOLDER, product: PLACEHOLDER }];
}

async function Redirect({ params }: Pick<PageProps<"/products/[category]/[product]">, "params">): Promise<never> {
  const product = await getProduct((await params).product);
  if (!product) notFound();
  permanentRedirect(`/products/${product.category.slug}/types#${product.slug}`);
}

export default function ProductPage({ params }: PageProps<"/products/[category]/[product]">) {
  return (
    <Suspense>
      <Redirect params={params} />
    </Suspense>
  );
}
