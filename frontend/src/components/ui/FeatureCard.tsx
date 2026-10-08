import Image from "next/image";

type Props = {
  title: string;
  text: string;
  icon?: string;
};

/** Bordered card with a tinted icon tile (Why Choose Us). Compact on phones, where cards sit two per row. */
export function FeatureCard({ title, text, icon = "/icons/protect.png" }: Props) {
  return (
    <article className="flex h-full flex-col rounded-card border border-ink/80 bg-white p-3 md:p-6">
      <div className="flex size-8 items-center justify-center rounded-md bg-brand-tint md:size-12 md:rounded-card">
        <Image src={icon} alt="" width={32} height={23} className="w-5 md:w-8" style={{ height: "auto" }} />
      </div>
      <h3 className="mt-2.5 text-title font-semibold leading-tight md:mt-4">{title}</h3>
      <p className="mt-1 font-alt text-body text-ink-soft md:mt-2">{text}</p>
    </article>
  );
}
