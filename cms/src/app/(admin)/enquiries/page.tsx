"use client";

import { Suspense } from "react";

import { EnquiryList } from "@/components/modules/EnquiryList";
import { Loading } from "@/components/ui/Layout";

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EnquiryList />
    </Suspense>
  );
}
