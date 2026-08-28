import type { AuthError } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_PREFIX = "/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )churchos_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface BackendErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
    method: string;
  };
}

interface BackendSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

type BackendResponse<T> = BackendSuccessResponse<T> | BackendErrorResponse;

function getErrorMessage(status: number, body: BackendErrorResponse): string {
  const msg = body.error?.message || "";
  switch (status) {
    case 400:
      return msg || "Invalid request. Please check your input.";
    case 401:
      return msg || "Invalid email or password.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return msg || "An account with this email already exists.";
    case 429:
      return "Too many attempts. Please try again later.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return msg || `Request failed (${status}). Please try again.`;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE}${API_PREFIX}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {};

    // FormData bodies must not carry a JSON content-type — the browser
    // sets the multipart boundary itself.
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (!options?.skipAuth) {
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body:
          body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });
    } catch {
      const error: AuthError = {
        message: "Network error. Please check your connection.",
        statusCode: 0,
      };
      throw error;
    }

    let json: BackendResponse<T> | undefined;
    try {
      json = (await res.json()) as BackendResponse<T>;
    } catch {
      // Empty body — e.g. 204 No Content deletes resolve to undefined.
      json = undefined;
    }

    // Handle error responses (both HTTP errors and 200-wrapped errors)
    if (!res.ok || (json && !json.success)) {
      const errorBody = json as BackendErrorResponse | undefined;
      const error: AuthError = {
        message: errorBody
          ? getErrorMessage(res.status, errorBody)
          : `Request failed (${res.status}). Please try again.`,
        statusCode: res.status,
      };
      throw error;
    }

    if (!json) return undefined as T;

    // Unwrap the data envelope: { success: true, data: T, meta: ... } → T
    const successBody = json as BackendSuccessResponse<T>;
    return successBody.data;
  }

  get<T>(path: string, options?: { skipAuth?: boolean }) {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) {
    return this.request<T>("POST", path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) {
    return this.request<T>("PATCH", path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: { skipAuth?: boolean }) {
    return this.request<T>("PUT", path, body, options);
  }

  delete<T>(path: string, options?: { skipAuth?: boolean }) {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /**
   * GETs a raw binary response (e.g. PDF receipts). Returns the parsed
   * body as JSON when the server replies with an error envelope.
   */
  async getBlob(path: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) {
      let message = `Request failed (${res.status}). Please try again.`;
      try {
        const json = (await res.json()) as BackendErrorResponse;
        message = getErrorMessage(res.status, json);
      } catch {
        // Non-JSON error body — keep the generic message.
      }
      throw { message, statusCode: res.status } as AuthError;
    }
    return res.blob();
  }

  /**
   * POSTs a JSON body expecting a binary response (none currently — kept
   * symmetric with getBlob for future exports).
   */
  async postForBlob(path: string, body: unknown): Promise<Blob> {
    const token = getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return res.blob();
  }
}

export const api = new ApiClient();
