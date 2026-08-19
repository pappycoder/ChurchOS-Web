import type { AuthError } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_PREFIX = "/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )churchos_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getErrorMessage(status: number, data: Record<string, unknown>): string {
  const raw = (data.message || data.error || "") as string;
  const msg = Array.isArray(raw) ? raw[0] : raw;

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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      const error: AuthError = {
        message: "Network error. Please check your connection.",
        statusCode: 0,
      };
      throw error;
    }

    if (!res.ok) {
      let errorData: Record<string, unknown>;
      try {
        errorData = await res.json();
      } catch {
        errorData = {};
      }
      const error: AuthError = {
        message: getErrorMessage(res.status, errorData),
        statusCode: res.status,
      };
      throw error;
    }

    return res.json();
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
}

export const api = new ApiClient();
