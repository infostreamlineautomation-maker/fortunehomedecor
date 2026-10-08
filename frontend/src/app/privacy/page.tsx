import type { Metadata } from "next";

import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" />;
}
