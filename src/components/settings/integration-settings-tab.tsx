"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Channel = "email" | "whatsapp" | "sms" | "voice" | "payment";
type Mode = "custom" | "disabled";
interface Provider { id: string; label: string; channels: Channel[]; fields: { key: string; label: string; secret?: boolean; optional?: boolean; options?: string[] }[]; help: string }
interface Account { id: string; provider: string; label: string; verification_status: string; verified_at: string | null; archived_at: string | null }
interface Binding { channel: Channel; mode: Mode; account_id: string | null; settings: Record<string, string>; updated_at: string }
interface Settings { providers: Provider[]; accounts: Account[]; channels: Binding[] }
const LABELS: Record<Channel, string> = { email: "Email", whatsapp: "WhatsApp", sms: "SMS", voice: "Live calls", payment: "Payments" };
function errorText(error: unknown) { return typeof error === "object" && error && "message" in error ? String(error.message) : "The request could not be completed."; }

export function IntegrationSettingsTab() {
  const { can } = usePermissions();
  const query = useQuery({ queryKey: ["integrations-settings"], queryFn: ({ signal }) => api.get<Settings>("/church/integrations", { signal }), enabled: can("integrations", "read"), staleTime: 60_000 });
  if (!can("integrations", "read")) return null;
  if (query.isLoading) return <p role="status">Loading integrations…</p>;
  if (query.isError) return <div role="alert">Unable to load integrations. <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>;
  if (!query.data) return null;
  return <div className="space-y-8">
    <p className="text-sm text-muted-foreground">Add provider accounts, check their credentials, then choose an account separately for each service. A compatible account can be shared across services. Each service stays disabled until you select and save a church-owned provider account. Platform credentials are never used for church services.</p>
    <ProviderAccounts data={query.data} canManage={can("integrations", "update")} />
    {Object.entries(LABELS).map(([channel, label]) => <ChannelSettings key={`${channel}:${query.data!.channels.find(item => item.channel === channel)?.updated_at ?? "legacy"}`} channel={channel as Channel} label={label} data={query.data!} canManage={can("integrations", "update")} />)}
  </div>;
}

function ProviderAccounts({ data, canManage }: { data: Settings; canManage: boolean }) {
  const client = useQueryClient();
  const [providerId, setProviderId] = React.useState(data.providers[0]?.id ?? "resend");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const provider = data.providers.find(item => item.id === providerId)!;
  async function refresh() { await client.invalidateQueries({ queryKey: ["integrations-settings"] }); }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    const form = event.currentTarget; const fields = new FormData(form); const credentials: Record<string, string> = {};
    for (const field of provider.fields) { const value = String(fields.get(field.key) ?? "").trim(); if (value) credentials[field.key] = value; }
    setBusy(true); setNotice("");
    try { await api.post("/church/integrations/accounts", { provider: providerId, label: String(fields.get("label") ?? "").trim(), credentials }); form.reset(); await refresh(); setNotice("Account saved securely. Check credentials before assigning it to a service."); }
    catch (error) { setNotice(errorText(error)); }
    finally { for (const field of provider.fields.filter(item => item.secret)) { const control = form.elements.namedItem(field.key); if (control instanceof HTMLInputElement) control.value = ""; } setBusy(false); }
  }
  async function accountAction(id: string, action: "verify" | "archive") {
    if (!canManage || busy) return; setBusy(true); setNotice("");
    try { const result = await api.post<{ message?: string }>(`/church/integrations/accounts/${id}/${action}`, {}); setNotice(result.message ?? "Account archived. Channels using it are blocked until another account is selected."); await refresh(); }
    catch (error) { setNotice(errorText(error)); } finally { setBusy(false); }
  }
  return <section id="provider-accounts" data-settings-section className="space-y-4">
    <h2 className="text-lg font-semibold">Provider accounts</h2>
    <p className="text-sm text-muted-foreground">Keys are encrypted on the server and cannot be viewed after saving. To rotate a key, add a replacement account, check it, switch the services, then archive the old account. Historical payments keep their original account for settlement.</p>
    {data.accounts.map(account => <div key={account.id} className="rounded-md border p-3 space-y-2" data-testid={`account-${account.id}`}>
      <p className="font-medium">{account.label} — {data.providers.find(item => item.id === account.provider)?.label}</p>
      <p className="text-sm text-muted-foreground">Credential check: {account.verification_status}{account.archived_at ? "; archived" : ""}. {account.verified_at ? `Last checked ${new Date(account.verified_at).toLocaleString()}` : "Not checked yet."}</p>
      {canManage && !account.archived_at && <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => void accountAction(account.id, "verify")}>Check credentials</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void accountAction(account.id, "archive")}>Archive account</Button></div>}
      {["termii", "twilio", "meta"].includes(account.provider) && <p className="break-all text-sm text-muted-foreground">Messaging callback on your backend: <code>/api/v1/integrations/webhooks/{account.id}</code></p>}
    </div>)}
    {canManage && <form key={providerId} onSubmit={create} autoComplete="off" data-sentry-block className="rounded-md border p-4 space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <legend className="font-medium">Add a provider account</legend>
        <div className="space-y-2"><Label htmlFor="integration-provider">Provider</Label><select id="integration-provider" value={providerId} onChange={event => setProviderId(event.currentTarget.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{data.providers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <p className="text-sm text-muted-foreground">{provider.help}</p>
        <div className="space-y-2"><Label htmlFor="account-label">Account name</Label><Input id="account-label" name="label" required maxLength={80} placeholder="For example: Church office account" /></div>
        {provider.fields.map(field => <div className="space-y-2" key={field.key}><Label htmlFor={`credential-${field.key}`}>{field.label}{field.optional ? " (optional)" : ""}</Label>{field.options ? <select id={`credential-${field.key}`} name={field.key} required={!field.optional} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{field.options.map(value => <option key={value} value={value}>{value}</option>)}</select> : <Input id={`credential-${field.key}`} name={field.key} type={field.secret ? "password" : "text"} required={!field.optional} maxLength={2048} autoComplete={field.secret ? "new-password" : "off"} spellCheck={false} />}</div>)}
        <Button type="submit">{busy ? "Working…" : "Save provider account"}</Button>
      </fieldset>
    </form>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </section>;
}

function ChannelSettings({ channel, label, data, canManage }: { channel: Channel; label: string; data: Settings; canManage: boolean }) {
  const saved = data.channels.find(item => item.channel === channel);
  const [mode, setMode] = React.useState<Mode>(saved?.mode === "custom" ? "custom" : "disabled");
  const [accountId, setAccountId] = React.useState(saved?.account_id ?? "");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const client = useQueryClient();
  const accounts = data.accounts.filter(account => !account.archived_at && data.providers.find(provider => provider.id === account.provider)?.channels.includes(channel));
  const selected = accounts.find(account => account.id === accountId);
  const provider = selected?.provider;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return; setBusy(true); setNotice("");
    const values = new FormData(event.currentTarget); const settings: Record<string, string> = {};
    if (mode === "custom") for (const key of ["from", "senderName", "replyTo"]) { const value = String(values.get(key) ?? "").trim(); if (value) settings[key] = value; }
    try { await api.put(`/church/integrations/channels/${channel}`, { mode, ...(mode === "custom" ? { accountId, provider, settings } : {}) }); toast.success(`${label} settings saved`); await client.invalidateQueries({ queryKey: ["integrations-settings"] }); }
    catch (error) { setNotice(errorText(error)); } finally { setBusy(false); }
  }
  async function test() {
    if (!canManage || busy) return; setBusy(true); setNotice("");
    try { const result = await api.post<{ message: string }>(`/church/integrations/channels/${channel}/test`, { recipient }); setNotice(result.message); } catch (error) { setNotice(errorText(error)); } finally { setBusy(false); }
  }
  return <section id={`channel-${channel}`} data-settings-section className="space-y-4 border-t pt-6">
    <h2 className="text-lg font-semibold">{label}</h2>
    <p className="text-sm text-muted-foreground">{saved ? `Saved mode: ${saved.mode}.` : "Disabled until your church selects a provider account."} {channel === "voice" && "Live calls ring your saved staff phone first, then connect the member. Calls are limited to ten minutes."}</p>
    <form onSubmit={save} className="space-y-4"><fieldset disabled={!canManage || busy} className="space-y-4">
      <div className="space-y-2"><Label htmlFor={`${channel}-mode`}>Account source</Label><select id={`${channel}-mode`} value={mode} onChange={event => setMode(event.currentTarget.value as Mode)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="custom">Choose provider account</option><option value="disabled">Disable this service</option></select></div>
      {mode === "custom" && <>
        <div className="space-y-2"><Label htmlFor={`${channel}-account`}>Provider account</Label><select id={`${channel}-account`} value={accountId} onChange={event => setAccountId(event.currentTarget.value)} required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select an account</option>{accounts.map(account => <option key={account.id} value={account.id} disabled={!['verified', 'limited'].includes(account.verification_status)}>{account.label} ({account.provider}; {account.verification_status})</option>)}</select></div>
        {selected?.verification_status === "limited" && <p className="text-sm text-muted-foreground">Account inspection was limited. Save this service and send a controlled test to confirm that the credentials and sender work.</p>}
        {channel === "email" && <div key={accountId} className="space-y-4">{[{ key: "from", label: "Sender email", required: true }, { key: "senderName", label: "Sender name", required: false }, { key: "replyTo", label: "Reply-to email", required: false }].map(field => <div className="space-y-2" key={field.key}><Label htmlFor={`${channel}-${field.key}`}>{field.label}</Label><Input id={`${channel}-${field.key}`} name={field.key} type={field.key === "senderName" ? "text" : "email"} required={field.required} defaultValue={saved?.account_id === accountId ? saved.settings[field.key] ?? "" : ""} maxLength={254} /></div>)}</div>}
        {['sms', 'voice', 'whatsapp'].includes(channel) && provider !== "meta" && <div className="space-y-2" key={accountId}><Label htmlFor={`${channel}-from`}>{provider === "termii" ? channel === "sms" ? "Approved SMS sender ID" : "WhatsApp device ID" : "Provider sender number (+country code)"}</Label><Input id={`${channel}-from`} name="from" required defaultValue={saved?.account_id === accountId ? saved.settings.from ?? "" : ""} maxLength={128} /></div>}
        {channel === "payment" && <p className="text-sm text-muted-foreground">The selected gateway becomes the church default for giving and paid event tickets. Card authorizations cannot move to another merchant account; recurring donors must authorize that account again.</p>}
      </>}
      {canManage && <Button type="submit">Save {label.toLowerCase()} settings</Button>}
    </fieldset></form>
    {channel === "payment" && <p className="break-all text-sm text-muted-foreground">Configure the payment account webhook on your backend at <code>/api/v1/integrations/payments/webhook/{provider ?? "PROVIDER"}</code>. Credential checks do not create or charge payments. Use the provider’s test keys and an ordinary checkout to test settlement.</p>}
    {canManage && saved?.mode === "custom" && channel !== "payment" && <div className="space-y-3" data-sentry-block>
      <p className="text-sm text-muted-foreground">Tests use saved settings and send a real message or connect a live call. Provider charges may apply. WhatsApp text tests need an open conversation window. Sender/domain approval remains the provider’s responsibility.</p>
      <div className="space-y-2"><Label htmlFor={`${channel}-recipient`}>{channel === "email" ? "Test email recipient" : channel === "voice" ? "Test call destination (+country code)" : "Test phone recipient (+country code)"}</Label><Input id={`${channel}-recipient`} type={channel === "email" ? "email" : "tel"} value={recipient} onChange={event => setRecipient(event.target.value)} /></div><Button type="button" variant="outline" onClick={() => void test()} disabled={busy || !recipient}>{channel === "voice" ? "Connect test call" : "Send test message"}</Button>
    </div>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </section>;
}
