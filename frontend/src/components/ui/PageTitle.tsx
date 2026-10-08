/** Centered red page title with grey intro line (Products, Curtain, About Us). */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="container-site pt-7 pb-2 text-center md:pt-14 md:pb-4">
      <h1 className="text-section font-semibold text-brand">{title}</h1>
      {subtitle && <p className="mx-auto mt-2 max-w-[760px] text-body-lg text-muted md:mt-3">{subtitle}</p>}
    </div>
  );
}
