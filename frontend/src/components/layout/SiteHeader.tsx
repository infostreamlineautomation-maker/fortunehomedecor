import Image from "next/image";
import Link from "next/link";

import { NAV_LINKS } from "@/content/site";
import { getSettings } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

import { HeaderActions } from "./HeaderActions";
import { MainNav } from "./MainNav";

export async function SiteHeader() {
  const { brand, contact, socials, footer } = await getSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white/95 backdrop-blur">
      <div className="container-site flex h-14 items-center justify-between gap-6 md:h-16 lg:h-[72px]">
        <Link href="/" aria-label={`${brand.name} home`} className="shrink-0">
          <Image
            src={mediaUrl(brand.logo)}
            alt={brand.name}
            width={223}
            height={75}
            className="w-[104px] md:w-[120px] lg:w-[150px]"
            style={{ height: "auto" }}
            preload
          />
        </Link>

        <MainNav links={NAV_LINKS} />

        <HeaderActions links={NAV_LINKS} brand={brand} contact={contact} socials={socials} footer={footer} />
      </div>
    </header>
  );
}
