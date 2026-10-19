"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { closeSupportChat, openSupportChat, TAWK_CHAT_URL } from "@/lib/tawk";

export function SupportScreen() {
  const { isAuthenticated } = useAuth();
  const { data: profile, isPending } = useCurrentProfile();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);
  const allowed = isAuthenticated && profile?.status === "active" && profile.role.some(role => role === "church_admin" || role === "super_admin");
  const scope = allowed ? `${profile.churchId}:${profile.profileId}` : "";

  useEffect(() => {
    active.current = !!scope;
    const stop = () => { active.current = false; closeSupportChat(); };
    window.addEventListener("churchos-session-ended", stop);
    return () => { window.removeEventListener("churchos-session-ended", stop); stop(); };
  }, [scope]);

  async function openChat() {
    if (!active.current || opening) return;
    setOpening(true);
    setError("");
    try { await openSupportChat(); }
    catch (err) { if (active.current) setError(err instanceof Error ? err.message : "Chat is unavailable. Please try again."); }
    finally { if (active.current) setOpening(false); }
  }

  if (isPending) return <p role="status">Loading support…</p>;
  if (!allowed) return <p role="status">Please contact your church administrator for support.</p>;
  return <div className="mx-auto w-full max-w-4xl space-y-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Help & Support</h1>
      <p className="mt-2 text-muted-foreground">Get help from the ChurchOS team with your church workspace.</p>
    </header>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="size-5" />Contact ChurchOS support</CardTitle>
        <CardDescription>Ask about getting started, managing members, subscriptions or a problem you’ve encountered.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">If the team is offline, leave a message and your email in the chat so we can reply.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void openChat()} disabled={opening}>{opening ? "Connecting…" : "Chat with support"}</Button>
          <Button variant="outline" asChild><a href={TAWK_CHAT_URL} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open support in a new tab<ExternalLink className="size-4" /></a></Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Chat is provided by tawk.to. Share only what’s needed to explain your issue. Never send passwords, payment details or confidential member information.</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Subscription questions?</CardTitle><CardDescription>Review your allowances, payment history and available plans.</CardDescription></CardHeader>
      <CardContent><Button variant="outline" asChild><Link href="/subscription">Plan & Billing</Link></Button></CardContent>
    </Card>
  </div>;
}
