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
    <AuthFormWrapper heading="Create Account" subtitle="Please enter your details to sign up">
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-3">
          <label className="smart-form-label">Full Name</label>
          <div className="flex items-stretch">
            <input
              type="text"
              className="smart-form-control flex-1"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
              <User className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="mb-3">
          <label className="smart-form-label">Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control pr-10"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="smart-form-label">Confirm Password</label>
          <div className="pass-group">
            <input
              type={showPassword ? "text" : "password"}
              className="smart-form-control pr-10"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="mb-3">
          <button type="submit" className="smart-btn smart-btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm" style={{ color: "#202C4B" }}>
            Already have an account?{" "}
            <Link href="/login" className="hover-a">Sign In</Link>
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
    </AuthFormWrapper>
  );
}
