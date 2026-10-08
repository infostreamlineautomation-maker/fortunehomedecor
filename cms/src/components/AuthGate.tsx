"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";

import { AdminShell } from "./AdminShell";
import { ConfirmProvider } from "./ui/Modal";
import { ToastProvider } from "./ui/Toast";

/** Redirects to /login without a session; otherwise renders the CMS shell. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.replace("/login");
  }, [admin, loading, router]);

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;
  }
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminShell>{children}</AdminShell>
      </ConfirmProvider>
    </ToastProvider>
  );
}
