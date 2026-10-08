import type { Metadata } from "next";

import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Shipping & Returns" };

export default function ShippingPage() {
  return <LegalPage title="Shipping & Returns" />;
}
