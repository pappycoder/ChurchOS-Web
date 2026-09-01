"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { AUTH_EASE } from "@/lib/auth-motion";
import { AuthFormWrapper } from "@/components/shared/auth-form-wrapper";
import { AuthField } from "@/components/shared/auth-field";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/hooks/use-auth";
import { DenominationCombobox } from "@/components/shared/denomination-combobox";

type RequiredBinding = "firstName" | "lastName" | "email" | "churchName";

interface RequiredField {
  label: string;
  binding: RequiredBinding;
  icon: React.ReactNode;
  placeholder: string;
  type?: "email" | "text";
  autoComplete?: string;
}

const requiredFields: RequiredField[] = [
  {
    label: "First Name",
    binding: "firstName",
    icon: <User className="h-4 w-4" />,
    placeholder: "Enter your first name",
    autoComplete: "given-name",
  },
  {
    label: "Last Name",
    binding: "lastName",
    icon: <User className="h-4 w-4" />,
    placeholder: "Enter your last name",
    autoComplete: "family-name",
  },
  {
    label: "Email Address",
    binding: "email",
    type: "email",
    icon: <Mail className="h-4 w-4" />,
    placeholder: "Enter your email",
    autoComplete: "email",
  },
  {
    label: "Church Name",
    binding: "churchName",
    icon: <Building2 className="h-4 w-4" />,
    placeholder: "Enter your church name",
  },
];

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
            description:
              (error as { message: string })?.message || "Please try again.",
          });
        },
      },
    );
  };

  return (
    <AuthFormWrapper
      heading="Create Account"
      subtitle="Please enter your details to sign up"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {requiredFields.map((field) => (
            <AuthField
              key={field.binding}
              label={field.label}
              type={field.type}
              icon={field.icon}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              value={
                field.binding === "firstName"
                  ? firstName
                  : field.binding === "lastName"
                    ? lastName
                    : field.binding === "email"
                      ? email
                      : churchName
              }
              onChange={(e) => {
                const value = e.target.value;
                if (field.binding === "firstName") setFirstName(value);
                else if (field.binding === "lastName") setLastName(value);
                else if (field.binding === "email") setEmail(value);
                else setChurchName(value);
              }}
              required
            />
          ))}

          <AuthField
            label="Password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <AuthField
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div>
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${showOptional ? "rotate-180" : ""}`}
                aria-hidden
              />
              Additional Information (Optional)
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showOptional && (
              <motion.div
                key="optional"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: AUTH_EASE }}
                className="overflow-hidden"
              >
                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <AuthField
                    label="Phone Number"
                    type="tel"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="+234 800 000 0000"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium leading-none">
                      Denomination
                    </span>
                    <DenominationCombobox
                      value={denomination}
                      onChange={setDenomination}
                    />
                  </div>
                  <AuthField
                    label="Church Address"
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="Enter church address"
                    value={churchAddress}
                    onChange={(e) => setChurchAddress(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {clientError && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {clientError}
            </motion.p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create Account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
