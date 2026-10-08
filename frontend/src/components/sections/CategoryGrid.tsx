import Link from "next/link";

import { MediaImage } from "@/components/ui/MediaImage";
import type { CategoryCard } from "@/lib/types";

/** Image cards linking to each collection ("Curtains →"). */
export function CategoryGrid({ categories, className = "" }: { categories: CategoryCard[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-5 md:gap-x-6 md:gap-y-8 lg:grid-cols-3 ${className}`}>
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/products/${c.slug}`} className="group block">
            <div className="relative aspect-[526/401] overflow-hidden rounded-media">
              <MediaImage
                src={c.card_image}
                alt={c.name}
                sizes="(min-width: 1024px) 420px, 50vw"
                className="transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <p className="mt-2 text-title font-medium md:mt-3">
              {c.name} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
