"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { useResetPassword } from "@/hooks/use-auth";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { ActionTooltip } from "@/components/ui/tooltip";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPasswordMutation = useResetPassword();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [clientError, setClientError] = React.useState<string | null>(null);

  const getPasswordStrength = (pw: string): { level: number; label: string } => {
    let level = 0;
    if (pw.length >= 8) level++;
    if (/[A-Z]/.test(pw)) level++;
    if (/[0-9]/.test(pw)) level++;
    if (/[^A-Za-z0-9]/.test(pw)) level++;
    if (pw.length === 0) level = 0;
    const labels = ["", "Poor", "Weak", "Strong", "Strong"];
    return { level, label: labels[level] || "" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setClientError("No reset token found. Please request a new reset link.");
      return;
    }

    resetPasswordMutation.mutate(
      { token, newPassword: password },
      {
        onSuccess: () => {
          toast.success("Password reset complete!", {
            description: "You can now sign in with your new password.",
          });
        },
        onError: (error) => {
          toast.error("Password reset failed", {
            description: (error as { message: string })?.message || "The token may have expired. Please request a new link.",
          });
        },
      }
    );
  };

  if (!token) {
    return (
      <AuthFormWrapper heading="Reset Password" subtitle="Invalid or missing reset token">
        <div className="text-center">
          <p className="mb-4" style={{ color: "#6B7280", fontSize: 14 }}>
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <button type="button" className="smart-btn smart-btn-primary w-full">
              Request New Reset Link
            </button>
          </Link>
          <div className="mt-3 text-center">
            <Link href="/login" className="text-sm hover-a">Back to Sign In</Link>
          </div>
        </div>
      </AuthFormWrapper>
    );
  }

  if (resetPasswordMutation.isSuccess) {
    return (
      <AuthFormWrapper heading="Reset Password" subtitle="Your password has been reset successfully">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#22C55E" }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: "#202C4B", fontSize: 18 }}>
            Password Reset Complete
          </h3>
          <p className="mb-6" style={{ color: "#6B7280", fontSize: 14 }}>
            You can now sign in with your new password.
          </p>
          <Link href="/login">
            <button type="button" className="smart-btn smart-btn-primary w-full">
              Sign In
            </button>
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      heading="Reset Password"
      subtitle="Your new password must be different from previous used passwords."
    >
      <form onSubmit={handleSubmit}>
        {/* New Password */}
        <div className="mb-3">
          <label className="smart-form-label">Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <ActionTooltip label={showPassword ? "Hide password" : "Show password"}>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </ActionTooltip>
          </div>

          {/* Password Strength Bars */}
          <div className="password-strength mt-2">
            <span className={strength.level >= 1 ? "active" : ""} data-level="poor" />
            <span className={strength.level >= 2 ? "active" : ""} data-level="weak" />
            <span className={strength.level >= 3 ? "active" : ""} data-level="strong" />
            <span className={strength.level >= 4 ? "active" : ""} data-level="heavy" />
          </div>

          {password.length > 0 && (
            <p className="password-info mt-1 mb-2" style={{ color: "#6B7280", fontSize: 12 }}>
              {strength.label}
            </p>
          )}

          <p className="mt-1" style={{ color: "#6B7280", fontSize: 12 }}>
            Use 8 or more characters with a mix of letters, numbers &amp; symbols.
          </p>
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="smart-form-label">Confirm Password</label>
          <div className="pass-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="smart-form-control pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <ActionTooltip label={showConfirmPassword ? "Hide password" : "Show password"}>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </ActionTooltip>
          </div>
        </div>

        {/* Client-side error */}
        {clientError && (
          <div className="mb-3 p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
            {clientError}
          </div>
        )}

        {/* Submit */}
        <div className="mb-3">
          <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? "Resetting..." : "Submit"}
          </button>
        </div>
      </form>
    </AuthFormWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
