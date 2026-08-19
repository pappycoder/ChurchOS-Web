"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    // TODO: Implement Supabase password reset
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

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
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>

          {/* Password Strength Bars */}
          <div className="password-strength mt-2">
            <span className={strength.level >= 1 ? "active" : ""} data-level="poor" />
            <span className={strength.level >= 2 ? "active" : ""} data-level="weak" />
            <span className={strength.level >= 3 ? "active" : ""} data-level="strong" />
            <span className={strength.level >= 4 ? "active" : ""} data-level="heavy" />
          </div>

          {/* Strength Label */}
          {password.length > 0 && (
            <p className="password-info mt-1 mb-2" style={{ color: "#6B7280", fontSize: 12 }}>
              {strength.label}
            </p>
          )}

          {/* Helper Text */}
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
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mb-3">
          <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={loading}>
            {loading ? "Resetting..." : "Submit"}
          </button>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
