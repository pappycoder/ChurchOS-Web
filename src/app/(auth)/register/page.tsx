"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { useRegister } from "@/hooks/use-auth";
import { Eye, EyeOff, Mail, User, Building2, Phone, MapPin } from "lucide-react";
import { DenominationCombobox } from "@/components/shared/denomination-combobox";
import { ActionTooltip } from "@/components/ui/tooltip";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [churchName, setChurchName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [denomination, setDenomination] = React.useState("");
  const [churchAddress, setChurchAddress] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showOptional, setShowOptional] = React.useState(false);
  const [clientError, setClientError] = React.useState<string | null>(null);

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

    registerMutation.mutate(
      {
        firstName,
        lastName,
        email,
        password,
        churchName,
        phone: phone || undefined,
        denomination: denomination || undefined,
        churchAddress: churchAddress || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Account created!", {
            description: "Please sign in with your new account.",
          });
          router.push("/login");
        },
        onError: (error) => {
          toast.error("Registration failed", {
            description: (error as { message: string })?.message || "Please try again.",
          });
        },
      }
    );
  };

  return (
    <AuthFormWrapper heading="Create Account" subtitle="Please enter your details to sign up">
      <form onSubmit={handleSubmit}>
        {/* First Name */}
        <div className="mb-3">
          <label className="smart-form-label">First Name</label>
          <div className="flex items-stretch">
            <input
              type="text"
              className="smart-form-control flex-1"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
              <User className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Last Name */}
        <div className="mb-3">
          <label className="smart-form-label">Last Name</label>
          <div className="flex items-stretch">
            <input
              type="text"
              className="smart-form-control flex-1"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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

        {/* Church Name */}
        <div className="mb-3">
          <label className="smart-form-label">Church Name</label>
          <div className="flex items-stretch">
            <input
              type="text"
              className="smart-form-control flex-1"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              placeholder="Enter your church name"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              required
            />
            <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
              <Building2 className="w-4 h-4" />
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

        {/* Optional Fields Toggle */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: "var(--primary)" }}
          >
            <span className={`transition-transform ${showOptional ? "rotate-90" : ""}`}>▸</span>
            Additional Information (Optional)
          </button>
        </div>

        {/* Optional Fields */}
        {showOptional && (
          <div className="mb-3 space-y-3 p-3 rounded-lg" style={{ backgroundColor: "#F8F9FA", border: "1px solid #ededed" }}>
            {/* Phone */}
            <div>
              <label className="smart-form-label">Phone Number</label>
              <div className="flex items-stretch">
                <input
                  type="tel"
                  className="smart-form-control flex-1"
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
                  <Phone className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Denomination */}
            <div>
              <label className="smart-form-label">Denomination</label>
              <DenominationCombobox value={denomination} onChange={setDenomination} />
            </div>

            {/* Church Address */}
            <div>
              <label className="smart-form-label">Church Address</label>
              <div className="flex items-stretch">
                <input
                  type="text"
                  className="smart-form-control flex-1"
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
                  placeholder="Enter church address"
                  value={churchAddress}
                  onChange={(e) => setChurchAddress(e.target.value)}
                />
                <span className="flex items-center justify-center px-2.5 bg-white border border-[#ededed] border-l-0 rounded-r-[5px] text-[#6B7280] min-h-[40px]">
                  <MapPin className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Client-side error */}
        {clientError && (
          <div className="mb-3 p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
            {clientError}
          </div>
        )}

        {/* Submit */}
        <div className="mb-3">
          <button
            type="submit"
            className="smart-btn smart-btn-primary w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating account..." : "Create Account"}
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
