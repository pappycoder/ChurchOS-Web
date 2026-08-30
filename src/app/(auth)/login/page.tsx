"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { useLogin, useVerifyTwoFactor } from "@/hooks/use-auth";
import { Eye, EyeOff, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { ActionTooltip } from "@/components/ui/tooltip";

export default function LoginPage() {
  const loginMutation = useLogin();
  const verifyMutation = useVerifyTwoFactor();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [otpStep, setOtpStep] = React.useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          if (res.requiresTwoFactor) {
            setTwoFactorEmail(res.twoFactorEmail ?? email);
            setOtpStep(true);
            toast.info("Check your email", {
              description: `Enter the code sent to ${res.twoFactorEmail ?? email} to finish signing in.`,
            });
          }
        },
        onError: (error) => {
          toast.error("Sign in failed", {
            description: (error as { message: string })?.message || "Invalid email or password.",
          });
        },
      }
    );
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("Invalid code", { description: "Enter the 6-digit code from your email." });
      return;
    }
    verifyMutation.mutate(
      { email, code: otpCode },
      {
        onError: (error) => {
          toast.error("Verification failed", {
            description: (error as { message: string })?.message || "Invalid or expired code.",
          });
        },
      }
    );
  };

  return (
    <AuthFormWrapper heading={otpStep ? "Verify Your Identity" : "Sign In"} subtitle="Please enter your details to sign in">
      {otpStep ? (
        <form onSubmit={handleVerify}>
          <div className="mb-4 flex items-center gap-3 rounded-[5px] border border-[#E7EAF0] bg-[#F8FAFC] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F0FF] text-[#1B84FF]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: "#202C4B" }}>
                Two-factor authentication required
              </p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Sent a code to {twoFactorEmail}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <label className="smart-form-label">Verification Code</label>
            <div className="flex items-stretch">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                className="smart-form-control flex-1"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="mb-3">
            <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? "Verifying..." : "Verify & Sign In"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm"
              style={{ color: "#202C4B" }}
              onClick={() => {
                setOtpStep(false);
                setOtpCode("");
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </button>
          </div>
        </form>
      ) : (
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-3">
          <label className="smart-form-label">Email Address</label>
          <div className="flex items-stretch">
            <input
              type="email"
              className="smart-form-control flex-1"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
              <Mail className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="smart-form-label">Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control pr-10"
              placeholder="Enter your password"
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
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="smart-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="smart-checkbox-label">Remember Me</span>
          </label>
          <Link href="/forgot-password" className="text-sm" style={{ color: "#E70D0D" }}>
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <div className="mb-3">
          <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Create Account */}
        <div className="text-center">
          <p className="text-sm" style={{ color: "#202C4B" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="hover-a">Create Account</Link>
          </p>
        </div>

        {/* Or Divider */}
        <div className="login-or">
          <span className="span-or">Or</span>
        </div>

        {/* Social Login Buttons */}
        <div className="mt-2">
          <div className="flex items-center justify-center flex-wrap gap-2">
            <button type="button" className="social-btn flex-1" style={{ backgroundColor: "#1B84FF", borderColor: "#1B84FF" }}>
              <Image src="/auth/facebook-logo.svg" alt="Facebook" width={24} height={24} />
            </button>
            <button type="button" className="social-btn flex-1" style={{ backgroundColor: "transparent", border: "1px solid #F8F9FA" }}>
              <Image src="/auth/google-logo.svg" alt="Google" width={24} height={24} />
            </button>
            <button type="button" className="social-btn flex-1" style={{ backgroundColor: "#212529", borderColor: "#212529" }}>
              <Image src="/auth/apple-logo.svg" alt="Apple" width={24} height={24} />
            </button>
          </div>
        </div>
      </form>
      )}
    </AuthFormWrapper>
  );
}
