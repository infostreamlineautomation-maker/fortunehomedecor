"use client";

import { useCallback, useEffect, useState } from "react";

import { adminFetch, ApiError } from "./api";

/** GET `path` from the admin API (re-fetches when `path` changes). Pass null to skip. */
export function useResource<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const key = path === null ? null : `${version}:${path}`;
  // `settled` records which request key the current data/error belong to
  const [state, setState] = useState<{ settled: string | null; data: T | null; error: string | null }>({
    settled: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (key === null || path === null) return;
    let cancelled = false;
    adminFetch<T>(path)
      .then((data) => !cancelled && setState({ settled: key, data, error: null }))
      .catch((e) => !cancelled && setState((s) => ({ settled: key, data: s.data, error: errorMessage(e) })));
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (update: T | null | ((prev: T | null) => T | null)) =>
      setState((s) => ({ ...s, data: typeof update === "function" ? (update as (p: T | null) => T | null)(s.data) : update })),
    [],
  );
  return { data: state.data, setData, error: state.error, loading: key !== null && state.settled !== key, reload };
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.message && e.message !== "Unprocessable Entity") return e.message;
    if (e.status === 422) return "Some fields are invalid — please check the form.";
    return e.message || `Request failed (${e.status})`;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

/** Warn before leaving the page with unsaved edits. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

export function formatDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
