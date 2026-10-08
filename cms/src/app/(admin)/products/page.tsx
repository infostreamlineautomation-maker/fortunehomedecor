"use client";

import { Suspense } from "react";

import { ProductList } from "@/components/modules/ProductList";
import { Loading } from "@/components/ui/Layout";

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductList />
    </Suspense>
  );
}
