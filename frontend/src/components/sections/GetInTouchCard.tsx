import Image from "next/image";

import { getPage, getSettings } from "@/lib/api";

const SOCIALS = [
  { key: "linkedin", icon: "/icons/linkedin.png", w: 27, h: 25 },
  { key: "facebook", icon: "/icons/facebook.png", w: 27, h: 25 },
  { key: "instagram", icon: "/icons/instagram.png", w: 40, h: 30 },
  { key: "youtube", icon: "/icons/youtube.png", w: 40, h: 30 },
] as const;

/** Dark "Get In Touch" card shown beside the FAQs on every page. */
export async function GetInTouchCard() {
  const [{ contact, socials }, home] = await Promise.all([getSettings(), getPage("home")]);
  const intro = home.get_in_touch ?? {};

  const channels = [
    { icon: "📞", title: "Call Us", text: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    { icon: "✉️", title: "Email Us", text: contact.email, href: `mailto:${contact.email}` },
    { icon: "📍", title: "Office Address", text: contact.address, href: "/contact" },
    { icon: "🕒", title: "Working Hours", text: contact.hours || "By appointment", href: "/contact" },
  ];
  const activeSocials = SOCIALS.filter((s) => socials[s.key]);

  return (
    <aside className="rounded-media bg-ink-soft px-5 py-6 text-white md:px-8 md:py-10">
      <h2 className="font-display text-h3 font-medium text-brand-soft">
        {intro.title || "Get In Touch"}
      </h2>
      {intro.text && <p className="mt-1.5 max-w-md font-alt text-[0.6875rem] leading-snug text-line md:mt-2 md:text-sm">{intro.text}</p>}

      <ul className="mt-5 flex flex-col gap-2.5 md:mt-6 md:gap-3">
        {channels.map((c) => (
          <li key={c.title}>
            <a
              href={c.href}
              className="flex items-center gap-3 rounded-md border border-glass-line bg-glass p-2.5 transition-colors hover:border-white/50 md:gap-4 md:rounded-card md:px-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-glass text-sm md:size-10 md:rounded-card md:text-lg" aria-hidden>
                {c.icon}
              </span>
              <span className="font-display text-[0.6875rem] font-semibold leading-tight md:text-sm md:font-medium md:leading-snug">
                {c.title}
                <br />
                <span className="text-[0.625rem] font-normal text-line md:text-sm">{c.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {activeSocials.length > 0 && (
        <>
          <hr className="mt-6 border-white/30 md:mt-8" />
          <p className="mt-3 font-alt text-[0.625rem] font-semibold tracking-wide text-line md:text-sm md:font-normal">Connect with us</p>
          <div className="mt-3 flex items-center gap-4">
            {activeSocials.map((s) => (
              <a key={s.key} href={socials[s.key]} aria-label={s.key} target="_blank" rel="noopener noreferrer">
                <Image src={s.icon} alt="" width={s.w} height={s.h} className="h-4 w-auto md:h-5" />
              </a>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
