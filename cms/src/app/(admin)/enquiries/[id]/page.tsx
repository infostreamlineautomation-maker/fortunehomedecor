import { EnquiryDetail } from "@/components/modules/EnquiryDetail";

// Client-rendered detail view; a placeholder id keeps the build happy, real ids render on demand.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function EnquiryPage() {
  return <EnquiryDetail />;
}
