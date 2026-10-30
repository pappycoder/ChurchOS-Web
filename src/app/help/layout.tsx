import { HelpShell } from "@/components/help/help-shell";
import { PublicPaperShell } from "@/components/shared/public-paper-shell";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicPaperShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6">
        <HelpShell>{children}</HelpShell>
      </div>
    </PublicPaperShell>
  );
}
