import Image from "next/image";

import type { Faq } from "@/lib/types";

type Props = {
  faqs: Faq[];
  title?: string;
};

/** Numbered FAQ list; native <details> so it works without JavaScript. */
export function FaqAccordion({ faqs, title = "FAQs" }: Props) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-display text-section font-medium text-brand">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-2.5 md:mt-6 md:gap-3">
        {faqs.map((faq, i) => (
          <details key={faq.question} className="group rounded-md border border-line bg-white md:rounded-card md:border-ink/80">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 font-alt text-body-lg font-medium md:gap-4 md:px-4 md:py-3.5 md:font-normal [&::-webkit-details-marker]:hidden">
              <span>
                {i + 1}. {faq.question}
              </span>
              <Image
                src="/icons/plus.png"
                alt=""
                width={22}
                height={22}
                className="size-4 shrink-0 object-contain transition-transform duration-200 group-open:rotate-45 md:size-5"
              />
            </summary>
            <p className="px-3 pb-3 font-alt text-body text-ink-soft md:px-4 md:pb-4">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
