import Link from "next/link";

import { getSettings } from "@/lib/api";

/** Placeholder for policy pages until the client supplies the text. */
export async function LegalPage({ title }: { title: string }) {
  const { contact } = await getSettings();
  return (
    <div className="container-site section-y max-w-3xl">
      <h1 className="text-section font-semibold text-brand">{title}</h1>
      <p className="mt-6 font-alt text-body-lg">
        Our {title.toLowerCase()} is being updated. For any questions, email{" "}
        <a href={`mailto:${contact.email}`} className="text-brand underline">
          {contact.email}
        </a>{" "}
        or <Link href="/contact" className="text-brand underline">contact us</Link>.
      </p>
    </div>
  );
}
