import { CategoryEditor } from "@/components/modules/CategoryEditor";

// Client-rendered editor; "new" is prerendered and other ids render on demand.
export function generateStaticParams() {
  return [{ id: "new" }];
}

export default function CategoryEditPage() {
  return <CategoryEditor />;
}
