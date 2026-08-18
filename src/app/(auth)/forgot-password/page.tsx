"use client";

import * as React from "react";
import Link from "next/link";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement Supabase forgot password
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <AuthFormWrapper heading="Forgot Password?" subtitle="No worries, we'll send you reset instructions">
      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
            <Mail className="w-8 h-8" style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#202C4B" }}>
            Check your email
          </h3>
          <p className="mb-6" style={{ color: "#6B7280" }}>
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/login">
            <button type="button" className="smart-btn w-full" style={{ backgroundColor: "transparent", border: "1px solid #ededed", color: "#374151" }}>
              Back to Sign In
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="smart-form-label">Email Address</label>
            <div className="flex items-stretch">
              <input
                type="text"
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

          <div className="mb-3">
            <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={loading}>
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm" style={{ color: "#6B7280" }}>
              &larr; Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthFormWrapper>
  );
}
