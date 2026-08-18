import Link from "next/link";
import Image from "next/image";

interface AuthFormWrapperProps {
  heading: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormWrapper({
  heading,
  subtitle,
  children,
  footer,
}: AuthFormWrapperProps) {
  return (
    <>
      {/* Logo at top */}
      <div className="text-center mb-5">
        <Link href="/" className="inline-block">
          <Image src="/auth/logo.svg" alt="ChurchOS" width={140} height={40} className="w-auto h-auto" priority />
        </Link>
      </div>

      {/* Form content in middle */}
      <div className="flex-grow flex flex-col justify-center">
        <div className="text-center mb-3">
          <h2 className="mb-2 font-bold" style={{ color: "#202C4B" }}>
            {heading}
          </h2>
          <p className="mb-0 text-sm" style={{ color: "#6B7280" }}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>

      {/* Footer at bottom */}
      <div className="mt-12 pb-6 text-center">
        {footer ?? (
          <p className="text-sm" style={{ color: "#111827" }}>
            Copyright &copy; 2026 - ChurchOS
          </p>
        )}
      </div>
    </>
  );
}
