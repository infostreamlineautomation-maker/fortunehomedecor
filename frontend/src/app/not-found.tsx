import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-site py-24 text-center">
      <p className="font-display text-hero font-bold text-brand">404</p>
      <h1 className="mt-2 text-title font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-body-lg text-muted">It may have moved, or the link may be out of date.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <ButtonLink href="/products" arrow>
          Browse products
        </ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Contact us
        </ButtonLink>
      </div>
    </div>
  );
}
