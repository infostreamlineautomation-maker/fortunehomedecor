export const ADMIN_API_URL = (process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:8001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Call the admin API from the browser. Auth is the httpOnly cookie the API sets on login,
 * so every request goes out with credentials.
 */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // JSON bodies need the header; FormData sets its own, and GETs skip it to avoid a CORS preflight
  const jsonBody = init.body != null && !(init.body instanceof FormData);
  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: jsonBody ? { "Content-Type": "application/json", ...init.headers } : init.headers,
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
