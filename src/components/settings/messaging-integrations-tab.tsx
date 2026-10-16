"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Provider = "resend" | "termii";
type Mode = "platform" | "custom" | "disabled";
export interface MessagingIntegrationStatus {
  provider: Provider;
  mode: Mode;
  configured: boolean;
  updatedAt: string | null;
}

export function MessagingIntegrationsTab() {
  const { can } = usePermissions();
  const query = useQuery({
    queryKey: ["messaging-integrations"],
    queryFn: ({ signal }) => api.get<MessagingIntegrationStatus[]>("/church/messaging-integrations", { signal }),
    enabled: can("messaging_integrations", "read"),
    staleTime: 60_000,
  });
  if (!can("messaging_integrations", "read")) return null;
  return <div className="space-y-8">
    <p className="text-sm text-muted-foreground">Choose ChurchOS messaging or connect accounts owned by your church. Saved secrets cannot be viewed. Changing accounts also changes which provider account is charged.</p>
    {query.isLoading && <p role="status">Loading messaging settings…</p>}
    {query.isError && <div role="alert">Unable to load messaging settings. <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>}
    {query.data?.map(status => <ProviderSettings key={`${status.provider}:${status.mode}:${status.updatedAt}`} status={status} canManage={can("messaging_integrations", "update")} />)}
  </div>;
}

function ProviderSettings({ status, canManage }: { status: MessagingIntegrationStatus; canManage: boolean }) {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const [mode, setMode] = React.useState<Mode>(status.mode);
  const [busy, setBusy] = React.useState(false);
  const [recipient, setRecipient] = React.useState("");
  const [channel, setChannel] = React.useState<"email" | "sms" | "whatsapp">(status.provider === "resend" ? "email" : "sms");
  const isEmail = status.provider === "resend";
  const formRef = React.useRef<HTMLFormElement>(null);
  const id = status.provider;
  const [testResult, setTestResult] = React.useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: Record<string, string> = { mode };
    if (mode === "custom") for (const field of ["apiKey", "from", "deviceId", "webhookSecret", "verifyToken", "baseUrl"]) {
      const value = String(data.get(field) ?? "").trim();
      if (value) input[field] = value;
    }
    setBusy(true);
    setTestResult("");
    try {
      // Direct requests avoid retaining secrets as mutation variables in the query cache.
      const updated = await api.put<MessagingIntegrationStatus[]>(`/church/messaging-integrations/${id}`, input);
      form.reset();
      queryClient.setQueryData(["messaging-integrations"], updated);
      toast.success("Messaging settings saved");
    } catch { toast.error("Unable to save. Check the credentials, sender details and encryption setup."); }
    finally {
      // Clear sensitive fields even if validation/network fails; never persist drafts.
      for (const field of ["apiKey", "webhookSecret", "verifyToken"]) {
        const control = form.elements.namedItem(field);
        if (control instanceof HTMLInputElement) control.value = "";
      }
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!canManage || busy) return;
    setBusy(true);
    setTestResult("");
    try {
      const result = await api.post<{ message: string }>(`/church/messaging-integrations/${id}/test`, { recipient, channel });
      setTestResult(result.message);
    } catch { setTestResult("Test failed. Check the saved account, verified sender, provider balance and channel setup."); }
    finally { setBusy(false); }
  }

  return <section id={id} data-settings-section className="space-y-4" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="text-lg font-semibold">{isEmail ? "Email — Resend" : "SMS & WhatsApp — Termii"}</h2>
    <p className="text-sm text-muted-foreground">Saved account: {status.mode}. {status.configured ? "Credentials configured; confirm delivery with a test." : "Sending is unavailable."}</p>
    <form ref={formRef} onSubmit={save} autoComplete="off" data-sentry-block className="space-y-4">
      <fieldset disabled={!canManage || busy} className="space-y-4">
        <div className="space-y-2"><Label htmlFor={`${id}-mode`}>Sending account</Label>
          <select id={`${id}-mode`} value={mode} onChange={event => { const nextMode = event.currentTarget.value as Mode; formRef.current?.reset(); setMode(nextMode); setTestResult(""); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="platform">ChurchOS platform account</option><option value="custom">Church-owned account</option><option value="disabled">Disable sending</option>
          </select>
        </div>
        {mode === "custom" && <>
          <p className="text-sm text-muted-foreground">Enter all account details when saving or rotating credentials. Use a sender approved by the provider.</p>
          <div className="space-y-2"><Label htmlFor={`${id}-key`}>API key</Label><Input id={`${id}-key`} name="apiKey" type="password" required minLength={8} maxLength={512} autoComplete="new-password" spellCheck={false} /></div>
          <div className="space-y-2"><Label htmlFor={`${id}-from`}>{isEmail ? "Verified sender email" : "Approved SMS sender ID"}</Label><Input id={`${id}-from`} name="from" type={isEmail ? "email" : "text"} required maxLength={isEmail ? 254 : 16} /></div>
          {!isEmail && <>
            <div className="space-y-2"><Label htmlFor={`${id}-base-url`}>Termii API address (match your provider dashboard)</Label><select id={`${id}-base-url`} name="baseUrl" defaultValue="https://api.ng.termii.com" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="https://api.ng.termii.com">Nigeria — api.ng.termii.com</option><option value="https://api.termii.com">Default — api.termii.com</option></select></div>
            <div className="space-y-2"><Label htmlFor={`${id}-device`}>WhatsApp device ID (optional for SMS-only accounts)</Label><Input id={`${id}-device`} name="deviceId" maxLength={128} /></div>
            <div className="space-y-2"><Label htmlFor={`${id}-secret`}>WhatsApp webhook signing secret (32+ characters)</Label><Input id={`${id}-secret`} name="webhookSecret" type="password" minLength={32} maxLength={512} autoComplete="new-password" /></div>
            <div className="space-y-2"><Label htmlFor={`${id}-token`}>Webhook verification token (optional, for legacy subscription checks)</Label><Input id={`${id}-token`} name="verifyToken" type="password" minLength={24} maxLength={512} autoComplete="new-password" /></div>
            <p className="break-all text-sm text-muted-foreground">Configure the provider webhook with HMAC-SHA512 signing on your backend API at <code>/api/v1/whatsapp/webhook/{profile?.churchId ?? "CHURCH_ID"}</code>. Use the signing key supplied by your Termii account. A verification token is only needed for legacy subscription checks. Never put secrets in the webhook URL.</p>
          </>}
        </>}
        {mode !== "custom" && status.mode === "custom" && <p className="text-sm text-muted-foreground">Saving will remove the church-owned credentials.</p>}
        {canManage && <Button type="submit">{busy ? "Working…" : "Save account settings"}</Button>}
      </fieldset>
    </form>
    {canManage && status.configured && <div className="space-y-3 border-t pt-4" data-sentry-block>
      <p className="text-sm text-muted-foreground">Tests use the saved account and send a real message. Provider charges may apply. WhatsApp text tests require an open conversation window.</p>
      {!isEmail && <div className="space-y-2"><Label htmlFor={`${id}-channel`}>Test channel</Label><select id={`${id}-channel`} value={channel} onChange={event => setChannel(event.target.value as "sms" | "whatsapp")} disabled={busy} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></div>}
      <div className="space-y-2"><Label htmlFor={`${id}-recipient`}>{isEmail ? "Test email address" : "Test phone number (for example +2348012345678)"}</Label><Input id={`${id}-recipient`} type={isEmail ? "email" : "tel"} value={recipient} onChange={event => setRecipient(event.target.value)} disabled={busy} /></div>
      <Button type="button" variant="outline" onClick={() => void sendTest()} disabled={busy || !recipient}>Send test message</Button>
      {testResult && <p role="status" className="text-sm">{testResult}</p>}
    </div>}
  </section>;
}
