import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal/company";

export function LegalNavigation({
  className = "",
  label = "Legal information",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={`flex flex-wrap gap-x-5 gap-y-2 text-xs ${className}`}
    >
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="underline-offset-4 hover:underline focus-visible:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
