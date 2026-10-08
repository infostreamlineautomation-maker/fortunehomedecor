import { getGlobalFaqs } from "@/lib/api";
import type { Faq } from "@/lib/types";

import { FaqAccordion } from "./FaqAccordion";
import { GetInTouchCard } from "./GetInTouchCard";

/** "Get In Touch" + "FAQs" block that closes every page in the design. Defaults to the global FAQs. */
export async function ContactFaqSection({ faqs }: { faqs?: Faq[] }) {
  const items = faqs && faqs.length > 0 ? faqs : await getGlobalFaqs();

  return (
    <section id="faqs" className="container-site section-y grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
      <GetInTouchCard />
      <FaqAccordion faqs={items} />
    </section>
  );
}
