"use client";

import { useRef } from "react";

import { buttonClasses } from "@/components/ui/Button";

import { EnquiryForm, type EnquiryType } from "./EnquiryForm";

type Props = {
  type: Exclude<EnquiryType, "contact">;
  productSlug?: string;
  categorySlug?: string;
  subject: string;
  variant?: "brand" | "outline";
  className?: string;
};

const TITLES = { quote: "Request a Quote", sample: "Request Samples" } as const;

/** "Request a Quote" / "Request Samples" pill that opens the enquiry form in a modal dialog. */
export function EnquiryButton({ type, productSlug, categorySlug, subject, variant = "brand", className = "" }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={buttonClasses(variant, `font-display ${variant === "outline" ? "bg-white" : ""} ${className}`)}
      >
        {TITLES[type]}
      </button>

      <dialog
        ref={dialog}
        aria-label={`${TITLES[type]}: ${subject}`}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto max-h-[90dvh] w-[min(600px,calc(100vw-1.5rem))] overflow-y-auto rounded-media p-0 backdrop:bg-black/60"
      >
        <div className="p-5 md:p-7">
          <div className="mb-4 flex items-start justify-between gap-4 md:mb-5">
            <div>
              <h2 className="font-display text-h4 font-semibold text-brand">{TITLES[type]}</h2>
              <p className="mt-0.5 font-alt text-xs text-muted md:text-sm">{subject}</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="text-2xl leading-none text-muted hover:text-ink">
              ×
            </button>
          </div>
          <EnquiryForm type={type} productSlug={productSlug} categorySlug={categorySlug} submitLabel={`Send ${type === "quote" ? "Request" : "Sample Request"}`} />
        </div>
      </dialog>
    </>
  );
}
