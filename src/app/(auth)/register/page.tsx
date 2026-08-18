"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { Eye, EyeOff, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    // TODO: Implement Supabase register
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  return (
    <AuthFormWrapper
      heading="Create Account"
      subtitle="Please enter your details to sign up"
    >
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-3">
          <label className="smart-form-label">Full Name</label>
          <div className="smart-input-group">
            <input
              type="text"
              className="smart-form-control"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <span className="input-icon">
              <User className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="mb-3">
          <label className="smart-form-label">Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="smart-form-label">Confirm Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mb-3">
          <button
            type="submit"
            className="smart-btn smart-btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <h6 className="fw-normal mb-0" style={{ color: "#202C4B", fontSize: 14 }}>
            Already have an account?{" "}
            <Link href="/login" className="hover-a">
              Sign In
            </Link>
          </h6>
        </div>

        {/* Or Divider */}
        <div className="login-or">
          <span className="span-or">Or</span>
        </div>

        {/* Social Login Buttons */}
        <div className="mt-2">
          <div className="d-flex align-items-center justify-content-center flex-wrap">
            <div className="text-center me-2 flex-fill">
              <button
                type="button"
                className="social-btn w-100"
                style={{ backgroundColor: "#1B84FF", borderColor: "#1B84FF" }}
              >
                <Image src="/auth/facebook-logo.svg" alt="Facebook" width={24} height={24} className="m-1" />
              </button>
            </div>
            <div className="text-center me-2 flex-fill">
              <button
                type="button"
                className="social-btn w-100"
                style={{ backgroundColor: "transparent", border: "1px solid #F8F9FA" }}
              >
                <Image src="/auth/google-logo.svg" alt="Google" width={24} height={24} className="m-1" />
              </button>
            </div>
            <div className="text-center flex-fill">
              <button
                type="button"
                className="social-btn w-100"
                style={{ backgroundColor: "#212529", borderColor: "#212529" }}
              >
                <Image src="/auth/apple-logo.svg" alt="Apple" width={24} height={24} className="m-1" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
