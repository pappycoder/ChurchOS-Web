"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { useForgotPassword } from "@/hooks/use-auth";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(
      { email },
      {
        onError: (error) => {
          toast.error("Failed to send reset link", {
            description: (error as { message: string })?.message || "Please try again.",
          });
        },
      }
    );
  };

  return (
    <AuthFormWrapper
      heading="Forgot Password?"
      subtitle="If you forgot your password, well, then we'll email you instructions to reset your password."
    >
      {forgotPasswordMutation.isSuccess ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
            <Mail className="w-8 h-8" style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: "#202C4B", fontSize: 18 }}>
            Check your email
          </h3>
          <p className="mb-6" style={{ color: "#6B7280", fontSize: 14 }}>
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

          <div className="mb-3">
            <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending ? "Sending..." : "Submit"}
            </button>
          </div>

          <div className="text-center">
            <h6 className="font-normal mb-0" style={{ color: "#202C4B", fontSize: 14 }}>
              Return to{" "}
              <Link href="/login" className="hover-a">Sign In</Link>
            </h6>
          </div>
        </form>
      )}
    </AuthFormWrapper>
  );
}
