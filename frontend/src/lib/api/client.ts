import { API_BASE_URL } from "@/lib/config";

/** Error raised for any failed API call; `status` is 0 when the server was unreachable. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

const FIELD_LABELS: Record<string, string> = { image_urls: "Photos", nightly_price: "Nightly price" };

function messageFromBody(body: ErrorBody | null, status: number): { code: string; message: string } {
  const error = body?.error;
  const code = error?.code ?? "HTTP_ERROR";
  // Validation errors carry per-field messages; surface them instead of the generic summary.
  if (code === "VALIDATION_ERROR" && Array.isArray(error?.details)) {
    const messages = error.details
      .map((d) => {
        if (typeof d !== "object" || !d || !("msg" in d)) return "";
        const msg = String(d.msg).replace(/^Value error, /, "");
        const loc = "loc" in d && Array.isArray(d.loc) ? d.loc : [];
        // Prefix body fields (e.g. ["body", "title"]) so form errors say which field failed.
        const field = loc[0] === "body" && typeof loc[1] === "string" ? loc[1] : null;
        return field ? `${FIELD_LABELS[field] ?? field.replace(/_/g, " ")}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (messages.length) return { code, message: messages.join(" · ") };
  }
  return { code, message: error?.message ?? `Request failed with status ${status}.` };
}

interface RequestOptions {
  params?: URLSearchParams;
  body?: unknown;
  /** Demo user to act as (mock auth header). */
  userId?: number;
}

export async function apiRequest<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, userId } = options;
  const query = params && params.size > 0 ? `?${params}` : "";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (userId !== undefined) headers["X-Demo-User-Id"] = String(userId);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${query}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "We couldn't reach the server. It may be waking up — try again shortly.");
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ErrorBody | null;
    const { code, message } = messageFromBody(errorBody, response.status);
    throw new ApiError(response.status, code, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiGet<T>(path: string, params?: URLSearchParams, userId?: number): Promise<T> {
  return apiRequest<T>("GET", path, { params, userId });
}

/** User-facing message for any error thrown by the API helpers. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
