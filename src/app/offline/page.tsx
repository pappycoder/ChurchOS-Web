import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "You're Offline - ChurchOS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <svg
          width="72"
          height="72"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
          aria-hidden="true"
        >
          <rect width="512" height="512" rx="112" fill="#2563EB" />
          <path
            d="M410 282h-36l4-14c2.616-8.9 1.42-18.4-3.2-26.4L366 232h44l44 50h-44z"
            fill="#fff"
          />
          <path d="M78 282h12l16-22-16-28h-12v50z" fill="#fff" />
          <path d="M118 304v4c0 10 8 18 18 18 10 0 18-8 18-18v-10l18-14v24c0 22-18 40-40 40-18 0-36-14-39-32z" fill="#fff" />
          <path
            d="M164 282c0 14-10 26-24 28v-12c8-1 14-7 14-16 0-9-8-15-18-15v-12c13 0 22 6 27 16h1z"
            fill="#fff"
          />
          <path
            d="M220 286c0 8 3 16 8 22-6 8-16 12-26 12-17 0-30-13-30-30 0-20 15-34 48-34 2 0 5 0 7 1-5 4-8 9-9 15-1 5-1 9 5 14h-3z"
            fill="#fff"
          />
          <path d="M244 302v37c0 12 8 17 22 17 18 0 18-7 18-17v-37h-40zm6-22c0-9 7-16 16-16 9 0 16 7 16 16 0 9-7 16-16 16-9 0-16-7-16-16z" fill="#F58229" />
        </svg>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            You&apos;re offline
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ChurchOS couldn&apos;t reach the server. Check your connection and
            try again. Your app shell is available offline.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </main>
  );
}
