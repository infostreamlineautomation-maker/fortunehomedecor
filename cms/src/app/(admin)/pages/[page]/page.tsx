import { PageEditor } from "@/components/modules/PageEditor";

export function generateStaticParams() {
  return ["home", "products", "about", "contact"].map((page) => ({ page }));
}

export default function EditPagePage() {
  return <PageEditor />;
}
