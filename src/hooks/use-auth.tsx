"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, refreshSession, setUnauthorizedHandler } from "@/lib/api";
import { fetchCurrentProfile } from "@/hooks/use-profile";
import {
  clearTokens,
  getAccessToken,
  parseJwt,
  setTokens,
} from "@/lib/session";
import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthUser,
} from "@/types/auth";

// Refresh the access token this many seconds before it would expire, so the
// still-valid access token authenticates the /auth/refresh call and the
// session is extended without any user-visible disruption.
const REFRESH_BUFFER_SECONDS = 60;

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

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = React.useRef(false);

  const clearRefreshTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Shared teardown for both explicit logout and forced session expiry.
  const handleSessionEnd = React.useCallback(
    (opts?: { showToast: boolean; message?: string }) => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      clearRefreshTimer();
      clearTokens();
      setTokenState(null);
      setUser(null);
      queryClient.clear();
      if (opts?.showToast) {
        toast.error(opts.message || "Your session has expired. Please sign in again.");
      }
      router.replace("/login");
      // Latched: prevents duplicate toasts/redirects from stale in-flight 401s
      // firing after a session ends. Reset on the next successful sign-in.
    },
    [clearRefreshTimer, router, queryClient]
  );

  React.useEffect(() => {
    // When any API request returns 401 and a silent refresh cannot recover the
    // session, log the user out and redirect.
    setUnauthorizedHandler(() => handleSessionEnd({ showToast: true }));
    return () => setUnauthorizedHandler(null);
  }, [handleSessionEnd]);

  // Schedule a silent refresh just before the access token expires, if the
  // session is still recoverable, otherwise end the session.
  const scheduleRefresh = React.useCallback(
    (expiresAt?: number | null) => {
      clearRefreshTimer();
      const expSeconds = expiresAt ?? null;
      if (!expSeconds) return;

      const delayMs = Math.max(
        (expSeconds - REFRESH_BUFFER_SECONDS) * 1000 - Date.now(),
        0
      );
      timerRef.current = setTimeout(async () => {
        const refreshed = await refreshSession();
        if (refreshed?.expiresAt) {
          const newToken = getAccessToken();
          if (newToken) {
            setTokenState(newToken);
          }
          scheduleRefresh(refreshed.expiresAt);
        } else {
          // Refresh token no longer valid — the session cannot be extended.
          handleSessionEnd({ showToast: true });
        }
      }, delayMs);
    },
    [clearRefreshTimer, handleSessionEnd]
  );

  React.useEffect(() => {
    const existingToken = getAccessToken();
    if (existingToken) {
      const parsed = parseJwt(existingToken);
      if (parsed && parsed.exp && (parsed.exp as number) * 1000 > Date.now()) {
        setTokenState(existingToken);
        setUser(getUserFromToken(existingToken));
        const exp = parsed.exp as number;
        scheduleRefresh(exp);
      } else {
        clearTokens();
        setTokenState(null);
        setUser(null);
      }
    }
    setIsLoading(false);
    return clearRefreshTimer;
  }, [scheduleRefresh, clearRefreshTimer]);

  const finalizeLogin = React.useCallback(
    async (res: LoginResponse) => {
      if (!res.accessToken) return;
      loggingOutRef.current = false;
      setTokens(res.accessToken, res.refreshToken);
      setTokenState(res.accessToken);
      setUser({
        userId: res.userId,
        email: res.email ?? "",
        profile: res.profile,
      });
      const parsed = parseJwt(res.accessToken);
      const exp = res.expiresAt ?? (parsed?.exp as number | undefined) ?? null;
      scheduleRefresh(exp);
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
    [router, queryClient, scheduleRefresh]
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
    handleSessionEnd({ showToast: false });
    toast.success("Logged out successfully");
  }, [handleSessionEnd]);

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
