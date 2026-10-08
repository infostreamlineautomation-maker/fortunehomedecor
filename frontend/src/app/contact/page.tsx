import type { Metadata } from "next";
import Image from "next/image";

import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { MediaImage } from "@/components/ui/MediaImage";
import { getCategories, getPage, getSettings } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const { intro = {} } = await getPage("contact");
  return { title: "Contact Us", description: intro.text };
}

const SOCIALS = [
  { key: "instagram", icon: "/icons/instagram.png" },
  { key: "facebook", icon: "/icons/facebook.png" },
  { key: "linkedin", icon: "/icons/linkedin.png" },
] as const;

/** Only Google Maps embeds may be iframed from the CMS-provided URL. */
function safeMapUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "www.google.com" && u.pathname.startsWith("/maps/embed") ? u.toString() : null;
  } catch {
    return null;
  }
}

export default async function ContactPage() {
  const [page, { contact, socials }, categories] = await Promise.all([getPage("contact"), getSettings(), getCategories()]);
  const { hero = {}, intro = {}, form = {}, map = {} } = page;
  const mapUrl = safeMapUrl(contact.map_embed_url || map.embed_url);

  const details = [
    { icon: "📞", label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    { icon: "✉️", label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { icon: "📍", label: "Address", value: contact.address },
  ];

  return (
    <>
      <section className="relative aspect-[1728/528] min-h-[150px] w-full overflow-hidden md:min-h-[220px]">
        <MediaImage src={hero.image} alt={hero.alt || hero.title || "Contact us"} sizes="100vw" preload />
        {/* The Figma banner has its text baked into the image; keep a heading for screen readers and SEO */}
        <h1 className="sr-only">{hero.title || "Contact Us"}</h1>
      </section>

      <section className="container-site grid gap-8 pb-8 md:pb-10 lg:grid-cols-[1fr_420px] lg:gap-12">
        <div className="pt-6 md:pt-8 lg:pt-14">
          <h2 className="max-w-[560px] text-display font-bold">{intro.title}</h2>
          {intro.text && <p className="mt-2.5 max-w-[600px] text-subhead md:mt-4">{intro.text}</p>}
          <ul className="mt-6 grid grid-cols-3 gap-3 md:mt-8 md:gap-6">
            {details.map((d) => (
              <li key={d.label} className="flex flex-col items-center text-center">
                <span className="flex h-8 w-9 items-center justify-center rounded-t-pill bg-brand-tint text-sm md:h-10 md:w-11 md:text-lg" aria-hidden>
                  {d.icon}
                </span>
                <span className="mt-1.5 font-alt text-title font-semibold md:mt-2">{d.label}</span>
                {d.href ? (
                  <a href={d.href} className="font-alt text-body leading-snug break-words hover:text-brand md:text-body-lg">
                    {d.value}
                  </a>
                ) : (
                  <span className="font-alt text-body leading-snug md:text-body-lg">{d.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        {intro.image && (
          <div className="relative hidden aspect-[588/975] overflow-hidden rounded-t-[400px] lg:-mt-[16vw] lg:block">
            <MediaImage src={intro.image} alt="" sizes="420px" />
          </div>
        )}
      </section>

      <section className="container-site grid gap-5 pb-10 md:gap-6 md:pb-14 lg:grid-cols-2">
        <div className="rounded-media bg-gradient-to-b from-brand to-[#380707] p-5 text-white md:p-8">
          {form.eyebrow && <p className="font-mono text-[0.6875rem] md:text-sm">{form.eyebrow}</p>}
          <h2 className="mt-1.5 mb-4 font-alt text-h4 font-semibold md:mt-2 md:mb-5">{form.title || "Tell us about your project."}</h2>
          <EnquiryForm
            type="contact"
            tone="dark"
            services={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            submitLabel={form.submit_label || "Send Message"}
          />
        </div>

        <div className="flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden rounded-media bg-line md:aspect-[788/628]">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                title="Office location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <MediaImage src={map.image} alt="Office location map" sizes="(min-width: 1024px) 45vw, 100vw" />
            )}
          </div>
          {SOCIALS.some((s) => socials[s.key]) && (
            <>
              <h2 className="mt-4 font-alt text-title font-bold md:mt-5">Social Media</h2>
              <div className="mt-2 flex gap-2.5 md:gap-3">
                {SOCIALS.filter((s) => socials[s.key]).map((s) => (
                  <a
                    key={s.key}
                    href={socials[s.key]}
                    aria-label={s.key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-9 items-center justify-center rounded-t-pill bg-brand-tint md:h-10 md:w-11"
                  >
                    <Image src={s.icon} alt="" width={22} height={22} className="object-contain" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
