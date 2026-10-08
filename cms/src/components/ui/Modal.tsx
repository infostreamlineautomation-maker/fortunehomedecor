"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "./Button";

/** Native <dialog> modal: Esc and backdrop click close it, focus is trapped by the browser. */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const width = { md: "w-[min(560px,calc(100vw-2rem))]", lg: "w-[min(860px,calc(100vw-2rem))]", xl: "w-[min(1100px,calc(100vw-2rem))]" }[size];

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto max-h-[90vh] rounded-card p-0 backdrop:bg-black/50 ${width}`}
    >
      {open && (
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-muted hover:text-ink">
              ×
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

type ConfirmOptions = { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean };
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** `const confirm = useConfirm(); if (await confirm({...})) ...` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => new Promise((resolve) => setPending({ ...options, resolve })), []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <Modal open={pending !== null} onClose={() => close(false)} title={pending?.title ?? ""}>
        <div className="text-sm">{pending?.message}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={pending?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
            {pending?.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </Modal>
    </ConfirmContext>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
