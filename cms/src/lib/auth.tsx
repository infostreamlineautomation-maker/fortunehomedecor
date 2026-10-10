"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { adminFetch, ApiError, setAdminToken } from "./api";

export type Admin = {
  id: number;
  email: string;
  full_name: string;
  role: "superadmin" | "editor";
  is_active: boolean;
};

type AuthState = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<Admin>("/auth/me")
      .then(setAdmin)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setAdminToken(null);
        } else {
          console.error(e);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res?.access_token) {
      setAdminToken(res.access_token);
    }
    setAdmin(await adminFetch<Admin>("/auth/me"));
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setAdminToken(null);
      setAdmin(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setAdmin(await adminFetch<Admin>("/auth/me"));
  }, []);

  return <AuthContext value={{ admin, loading, login, logout, refresh }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
