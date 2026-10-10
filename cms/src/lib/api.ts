export const ADMIN_API_URL = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

const TOKEN_KEY = "fd_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Call the admin API from the browser. Supports both Authorization Bearer token
 * and httpOnly credentials cookie as fallback.
 */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jsonBody = init.body != null && !(init.body instanceof FormData);
  const token = getAdminToken();

  const headers: Record<string, string> = {
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((d: { loc?: (string | number)[]; msg?: string }) => {
            const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : "";
            const msg = d.msg || "Invalid value";
            return loc ? `${loc}: ${msg}` : msg;
          })
          .join("; ");
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
