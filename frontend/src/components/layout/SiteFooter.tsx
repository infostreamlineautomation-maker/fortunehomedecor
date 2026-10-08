import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { COMPANY_LINKS, LEGAL_LINKS } from "@/content/site";
import { getCategories, getSettings } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

const SOCIALS = [
  { key: "instagram", icon: "/icons/instagram-footer.png" },
  { key: "facebook", icon: "/icons/facebook-footer.png" },
  { key: "linkedin", icon: "/icons/linkedin-footer.png" },
] as const;

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold md:text-lg">{title}</h2>
      <div className="mt-2.5 font-serif-alt text-[0.6875rem] leading-[2] text-white/90 md:mt-3 md:text-[0.9375rem] md:text-white">{children}</div>
    </div>
  );
}

export async function SiteFooter() {
  const [{ brand, contact, socials, footer }, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <footer className="mt-auto bg-brand text-white">
      <div className="container-site grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-3 md:gap-10 md:py-12 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:py-14">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Image
            src={mediaUrl(brand.logo)}
            alt={brand.name}
            width={502}
            height={169}
            className="w-[140px] max-w-full md:w-[220px]"
            style={{ height: "auto" }}
          />
          <p className="mt-4 font-display text-[1.0625rem] font-bold md:mt-5 md:text-h4">{brand.tagline}</p>
          <p className="mt-1.5 max-w-[420px] text-[0.6875rem] leading-relaxed text-white/85 md:mt-2 md:text-[0.9375rem] md:text-white/90">{brand.description}</p>
          <ButtonLink href={footer.cta_href || "/contact"} variant="light" arrow className="mt-4 font-serif md:mt-6">
            {footer.cta_label}
          </ButtonLink>
        </div>

        <FooterColumn title="Collections">
          <ul>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/products/${c.slug}`} className="hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn title="Company">
          <ul>
            {COMPANY_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <div className="col-span-2 md:col-span-1">
        <FooterColumn title="Connect">
          <p>
            Email:{" "}
            <a href={`mailto:${contact.email}`} className="underline">
              {contact.email}
            </a>
          </p>
          <p>
            Phone: <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
          </p>
          <p>Location: {contact.location}</p>
          <div className="mt-3 flex gap-2 md:mt-4">
            {SOCIALS.filter((s) => socials[s.key]).map((s) => (
              <a key={s.key} href={socials[s.key]} aria-label={s.key} target="_blank" rel="noopener noreferrer">
                <Image src={s.icon} alt="" width={36} height={36} className="size-6 md:size-9" />
              </a>
            ))}
          </div>
        </FooterColumn>
        </div>
      </div>

      <div className="bg-black/25">
        <div className="container-site flex flex-col items-center gap-1.5 py-4 text-center font-serif-alt text-[0.6875rem] text-white/90 md:flex-row md:items-center md:justify-between md:py-5 md:text-left md:text-sm md:text-white">
          <p>{footer.copyright}</p>
          <p>
            {LEGAL_LINKS.map((l, i) => (
              <span key={l.href}>
                {i > 0 && " · "}
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
