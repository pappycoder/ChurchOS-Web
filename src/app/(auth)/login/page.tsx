"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import { AUTH_EASE } from "@/lib/auth-motion";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { AuthField } from "@/components/shared/auth-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogin, useVerifyTwoFactor } from "@/hooks/use-auth";

// Temporary development helper for the seeded demo accounts.
const DEV_PASSWORD = "ChurchOS@1234";
const DEV_ACCOUNTS = [
  { label: "HQ · Super Admin", email: "superadmin@churchos.dev" },
  { label: "HQ · Senior Pastor", email: "senior.pastor@churchos.dev" },
  { label: "HQ · Church Admin", email: "admin@churchos.dev" },
  { label: "HQ · Treasurer", email: "treasurer.hq@churchos.dev" },
  { label: "HQ · Secretary", email: "secretary.hq@churchos.dev" },
  { label: "HQ · Department Head", email: "dept.head.hq@churchos.dev" },
  { label: "HQ · Member", email: "member.hq@churchos.dev" },
  { label: "HQ · Cell Leader", email: "cell.leader.hq@churchos.dev" },
  { label: "Lekki · Branch Pastor", email: "branch.pastor@churchos.dev" },
  { label: "Lekki · Secretary", email: "branch.secretary@churchos.dev" },
  { label: "Lekki · Treasurer", email: "branch.treasurer@churchos.dev" },
  { label: "Lekki · Department Head", email: "branch.depthead@churchos.dev" },
  { label: "Lekki · Cell Leader", email: "cell.leader@churchos.dev" },
  { label: "Lekki · Member", email: "member.lekki@churchos.dev" },
  { label: "HQ · Fatima Abdullahi", email: "fatima.abdullahi@churchos.dev" },
  { label: "Lekki · Ngozi Eze", email: "ngozi.eze@churchos.dev" },
  { label: "HQ · Aisha Mohammed", email: "aisha.mohammed@churchos.dev" },
  { label: "Lekki · Kunle Fashola", email: "kunle.fashola@churchos.dev" },
  { label: "HQ · Blessing Effiong", email: "blessing.effiong@churchos.dev" },
];

export default function LoginPage() {
  const loginMutation = useLogin();
  const verifyMutation = useVerifyTwoFactor();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
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
            description:
              (error as { message: string })?.message ||
              "Invalid email or password.",
          });
        },
      },
    );
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("Invalid code", {
        description: "Enter the 6-digit code from your email.",
      });
      return;
    }
    verifyMutation.mutate(
      { email, code: otpCode },
      {
        onError: (error) => {
          toast.error("Verification failed", {
            description:
              (error as { message: string })?.message ||
              "Invalid or expired code.",
          });
        },
      },
    );
  };

  return (
    <AuthFormWrapper
      heading={otpStep ? "Verify Your Identity" : "Sign In"}
      subtitle={
        otpStep
          ? "Enter the 6-digit code we emailed to you."
          : "Please enter your details to sign in"
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {otpStep ? (
          <motion.form
            key="otp"
            onSubmit={handleVerify}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: AUTH_EASE }}
          >
            <div className="mb-5 flex items-center gap-3 rounded-lg border bg-muted/40 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Two-factor authentication required
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent a code to {twoFactorEmail}
                </p>
              </div>
            </div>

            <AuthField
              label="Verification Code"
              icon={<ShieldCheck className="h-4 w-4" />}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
            />

            <div className="mt-5">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  setOtpStep(false);
                  setOtpCode("");
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="credentials"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease: AUTH_EASE }}
          >
            <div className="space-y-4">
              {/* TODO: Remove or comment out this seed-account picker before release. */}
              <div className="space-y-1.5">
                <label
                  htmlFor="dev-account"
                  className="text-sm font-medium leading-none"
                >
                  Quick sign-in (development)
                </label>
                <select
                  id="dev-account"
                  defaultValue=""
                  onChange={(event) => {
                    const account = DEV_ACCOUNTS.find(
                      (item) => item.email === event.target.value,
                    );
                    if (account) {
                      setEmail(account.email);
                      setPassword(DEV_PASSWORD);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Select a seeded account…
                  </option>
                  {DEV_ACCOUNTS.map((account) => (
                    <option key={account.email} value={account.email}>
                      {account.label} — {account.email}
                    </option>
                  ))}
                </select>
              </div>
              <AuthField
                label="Email Address"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <AuthField
                label="Password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(c === true)}
                />
                Remember Me
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-destructive hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-5">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Create Account
              </Link>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthFormWrapper>
  );
}
