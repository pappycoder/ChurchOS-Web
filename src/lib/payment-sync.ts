const channelName = "churchos:subscription-payment-sync";
interface PaymentHint { churchId: string; reference: string }
function hint(value: unknown): value is PaymentHint {
  if (!value || typeof value !== "object") return false;
  const data = value as PaymentHint;
  return typeof data.churchId === "string" && !!data.churchId &&
    typeof data.reference === "string" && /^COSUB_[a-f0-9]{32}$/.test(data.reference);
}
/** A wake-up hint only: receivers must verify payment on their own server session. */
export function publishPaymentHint(data: PaymentHint) {
  if (!hint(data)) return;
  try {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(data);
    channel.close();
  } catch { /* Storage events also work when BroadcastChannel is unavailable. */ }
  try {
    localStorage.setItem(channelName, JSON.stringify({ ...data, nonce: crypto.randomUUID() }));
    localStorage.removeItem(channelName);
  } catch { /* Normal polling/focus recovery remains available. */ }
}
export function subscribePaymentHints(receive: (data: PaymentHint) => void) {
  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(channelName);
    channel.onmessage = event => { if (hint(event.data)) receive(event.data); };
  } catch { /* Use storage events instead. */ }
  const storage = (event: StorageEvent) => {
    if (event.key !== channelName || !event.newValue) return;
    try { const data: unknown = JSON.parse(event.newValue); if (hint(data)) receive(data); } catch { /* Ignore unrelated malformed hints. */ }
  };
  window.addEventListener("storage", storage);
  return () => { channel?.close(); window.removeEventListener("storage", storage); };
}
