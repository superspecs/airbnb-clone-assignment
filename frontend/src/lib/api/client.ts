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

function messageFromBody(body: ErrorBody | null, status: number): { code: string; message: string } {
  const error = body?.error;
  const code = error?.code ?? "HTTP_ERROR";
  // Validation errors carry per-field messages; surface them instead of the generic summary.
  if (code === "VALIDATION_ERROR" && Array.isArray(error?.details)) {
    const messages = error.details
      .map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : ""))
      .map((m) => m.replace(/^Value error, /, ""))
      .filter(Boolean);
    if (messages.length) return { code, message: messages.join(" ") };
  }
  return { code, message: error?.message ?? `Request failed with status ${status}.` };
}

export async function apiGet<T>(path: string, params?: URLSearchParams): Promise<T> {
  const query = params && params.size > 0 ? `?${params}` : "";
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${query}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "We couldn't reach the server. Check that the API is running.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    const { code, message } = messageFromBody(body, response.status);
    throw new ApiError(response.status, code, message);
  }
  return (await response.json()) as T;
}
