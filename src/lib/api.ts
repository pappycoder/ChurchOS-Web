import type { AuthError } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_PREFIX = "/api/v1";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )churchos_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
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

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errorData: AuthError;
      try {
        const data = await res.json();
        errorData = {
          message: data.message || data.error || "An error occurred",
          statusCode: res.status,
        };
      } catch {
        errorData = {
          message: `Request failed with status ${res.status}`,
          statusCode: res.status,
        };
      }
      throw errorData;
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
