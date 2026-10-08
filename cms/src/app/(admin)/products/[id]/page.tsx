import { Suspense } from "react";

import { ProductEditor } from "@/components/modules/ProductEditor";
import { Loading } from "@/components/ui/Layout";

// Client-rendered editor; "new" is prerendered and other ids render on demand.
export function generateStaticParams() {
  return [{ id: "new" }];
}

export default function ProductEditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductEditor />
    </Suspense>
  );
}
