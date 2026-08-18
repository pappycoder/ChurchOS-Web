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
    <AuthFormWrapper
      heading="Forgot Password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      {sent ? (
        <div className="text-center">
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(37, 99, 235, 0.1)" }}
          >
            <Mail style={{ width: 32, height: 32, color: "var(--primary)" }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#202C4B", marginBottom: 8 }}>
            Check your email
          </h3>
          <p style={{ color: "#6B7280", marginBottom: 24 }}>
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/login">
            <button
              type="button"
              className="smart-btn w-100"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #ededed",
                color: "#374151",
              }}
            >
              Back to Sign In
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="smart-form-label">Email Address</label>
            <div className="smart-input-group">
              <input
                type="text"
                className="smart-form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="input-icon">
                <Mail className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="mb-3">
            <button
              type="submit"
              className="smart-btn smart-btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              style={{ color: "#6B7280", fontSize: 14 }}
            >
              &larr; Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthFormWrapper>
  );
}
