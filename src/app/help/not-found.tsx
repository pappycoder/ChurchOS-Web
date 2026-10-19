import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function HelpNotFound() {
  return (
    <section className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">HELP CENTRE</p>
      <h1 className="text-3xl font-semibold">We couldn’t find that guide</h1>
      <p className="text-muted-foreground">
        The link may have changed. Search the Help Centre to find the task you
        need.
      </p>
      <Button asChild>
        <Link href="/help">Browse the Help Centre</Link>
      </Button>
    </section>
  );
}
