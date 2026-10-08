import { Badge } from "@/components/ui/Layout";
import type { EnquiryStatus, EnquiryType } from "@/lib/types";

export const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  contact: "Contact",
  quote: "Quote request",
  sample: "Sample request",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  closed: "Closed",
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  const tone = status === "new" ? "red" : status === "in_progress" ? "amber" : "green";
  return <Badge tone={tone}>{ENQUIRY_STATUS_LABELS[status]}</Badge>;
}
