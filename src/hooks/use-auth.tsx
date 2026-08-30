"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { fetchCurrentProfile } from "@/hooks/use-profile";
import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthUser,
} from "@/types/auth";

function setToken(token: string) {
  document.cookie = `churchos_token=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=86400`;
}

function removeToken() {
  document.cookie = "churchos_token=; path=/; max-age=0";
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )churchos_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getUserFromToken(token: string): AuthUser | null {
  const payload = parseJwt(token);
  if (!payload) return null;
  return {
    userId: (payload.sub as string) || "",
    email: (payload.email as string) || "",
    profile: payload.profile
      ? (payload.profile as AuthUser["profile"])
      : undefined,
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<LoginResponse>;
  verifyTwoFactor: (input: { email: string; code: string }) => Promise<void>;
  register: (input: RegisterInput) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setTokenState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const existingToken = getTokenFromCookie();
    if (existingToken) {
      const parsed = parseJwt(existingToken);
      if (parsed && parsed.exp && (parsed.exp as number) * 1000 > Date.now()) {
        setTokenState(existingToken);
        setUser(getUserFromToken(existingToken));
      } else {
        removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const finalizeLogin = React.useCallback(
    async (res: LoginResponse) => {
      if (!res.accessToken) return;
      setToken(res.accessToken);
      setTokenState(res.accessToken);
      setUser({
        userId: res.userId,
        email: res.email ?? "",
        profile: res.profile,
      });
      toast.success("Welcome back!", {
        description: `Signed in as ${res.email ?? ""}`,
      });
      // Prime the session cache (profile + permissions) before navigating so
      // permission gates render instantly instead of flashing skeletons.
      try {
        await queryClient.ensureQueryData({
          queryKey: ["current-profile"],
          queryFn: fetchCurrentProfile,
        });
      } catch {
        // Non-fatal: the dashboard will fetch on mount if priming fails.
      }
      router.push("/dashboard");
    },
    [router, queryClient]
  );

  const login = React.useCallback(
    async (input: LoginInput) => {
      const res = await api.post<LoginResponse>("/auth/login", input, {
        skipAuth: true,
      });
      if (res.requiresTwoFactor) {
        // Account has email-OTP 2FA enabled: no token is issued yet. The login
        // page must collect the emailed code and call verifyTwoFactor.
        return res;
      }
      await finalizeLogin(res);
      return res;
    },
    [finalizeLogin]
  );

  const verifyTwoFactor = React.useCallback(
    async ({ email, code }: { email: string; code: string }) => {
      const res = await api.post<LoginResponse>("/auth/login/2fa", { email, code }, {
        skipAuth: true,
      });
      await finalizeLogin(res);
    },
    [finalizeLogin]
  );

  const register = React.useCallback(async (input: RegisterInput) => {
    const res = await api.post<RegisterResponse>("/auth/register", input, {
      skipAuth: true,
    });
    return res;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout even if the API call fails
    }
    removeToken();
    setTokenState(null);
    setUser(null);
    queryClient.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  }, [router, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        verifyTwoFactor,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: login,
  });
}

export function useVerifyTwoFactor() {
  const { verifyTwoFactor } = useAuth();
  return useMutation({
    mutationFn: verifyTwoFactor,
  });
}

export function useRegister() {
  const { register } = useAuth();
  return useMutation({
    mutationFn: register,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: ForgotPasswordInput) => {
      return api.post<{ success: boolean }>("/auth/forgot-password", input, {
        skipAuth: true,
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => {
      return api.patch<{ success: boolean }>("/auth/reset-password", input, {
        skipAuth: true,
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: logout,
  });
}
