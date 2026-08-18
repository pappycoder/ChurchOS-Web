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
          <Image
            src="/auth/logo.svg"
            alt="ChurchOS"
            width={140}
            height={40}
            className="img-fluid"
            priority
          />
        </Link>
      </div>

      {/* Form content in middle */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center">
        <div className="text-center mb-3">
          <h2 className="mb-2" style={{ color: "#202C4B", fontWeight: 700 }}>
            {heading}
          </h2>
          <p className="mb-0" style={{ color: "#6B7280", fontSize: 14 }}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>

      {/* Footer at bottom */}
      <div className="auth-footer">
        {footer ?? (
          <p>Copyright &copy; 2026 - ChurchOS</p>
        )}
      </div>
    </>
  );
}
