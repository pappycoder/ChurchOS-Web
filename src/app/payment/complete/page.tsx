import { PRIVATE_ROBOTS } from "@/lib/seo";
export const metadata = { title: "Payment confirmation", robots: PRIVATE_ROBOTS };
import Link from "next/link";
export default function PaymentCompletePage() {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6 py-12">
    <h1 className="text-2xl font-semibold">Your payment is being confirmed</h1>
    <p className="text-muted-foreground">We will confirm your payment after the payment provider verifies it. Returning to this page alone does not confirm a successful payment.</p>
    <Link href="/login" className="font-medium text-primary underline">Return to ChurchOS</Link>
  </main>;
}
