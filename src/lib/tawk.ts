/** Public widget identifiers supplied by the ChurchOS support team. No API secret. */
export const TAWK_EMBED_URL = "https://embed.tawk.to/6ad5c1c809d49434c8f515a2/1k59fptu4";
export const TAWK_CHAT_URL = "https://tawk.to/chat/6ad5c1c809d49434c8f515a2/1k59fptu4";

interface TawkApi {
  autoStart?: boolean;
  onLoad?: () => void;
  start?: (options: { showWidget: boolean }) => void;
  hideWidget?: () => void;
  showWidget?: () => void;
  maximize?: () => void;
  endChat?: () => void;
  logout?: (callback?: (error?: unknown) => void) => void;
  shutdown?: () => void;
}
declare global {
  interface Window { Tawk_API?: TawkApi; Tawk_LoadStart?: Date }
}
let loading: Promise<TawkApi> | undefined;
let generation = 0;
let connected = false;

function loadTawk(): Promise<TawkApi> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const api: TawkApi = { autoStart: false };
    window.Tawk_API = api;
    window.Tawk_LoadStart = new Date();
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      // Leave a failed SDK dormant, including if its onLoad arrives late.
      api.onLoad = () => { api.hideWidget?.(); api.shutdown?.(); };
      loading = undefined;
      reject(new Error("Chat could not load. Please try again or open the support link."));
    };
    const timer = setTimeout(fail, 20000);
    api.onLoad = () => {
      clearTimeout(timer);
      api.hideWidget?.();
      resolve(api);
    };
    script.async = true;
    script.src = TAWK_EMBED_URL;
    script.charset = "UTF-8";
    script.crossOrigin = "anonymous";
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

/** Lazy anonymous chat: ChurchOS tokens, profile and church data are never sent. */
export async function openSupportChat(): Promise<void> {
  const request = ++generation;
  const api = await loadTawk();
  if (request !== generation) return;
  if (connected) { api.showWidget?.(); api.maximize?.(); return; }
  api.start?.({ showWidget: false });
  await new Promise<void>((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => { expired = true; reject(new Error("Chat could not connect. Please try the support link.")); }, 15000);
    if (!api.logout) { clearTimeout(timer); reject(new Error("Chat is unavailable. Please try the support link.")); return; }
    // Ask the provider to reset its visitor session before opening chat.
    api.logout((error) => {
      clearTimeout(timer);
      if (expired || request !== generation) { resolve(); return; }
      if (error) { reject(new Error("Chat could not connect. Please try the support link.")); return; }
      connected = true;
      api.showWidget?.();
      api.maximize?.();
      resolve();
    });
  });
}

/** Also invalidates an in-flight load so it cannot reopen after sign-out. */
export function closeSupportChat(): void {
  const request = ++generation;
  connected = false;
  const api = window.Tawk_API;
  api?.hideWidget?.();
  api?.endChat?.();
  api?.logout?.(() => { if (request === generation) api.shutdown?.(); });
  api?.shutdown?.();
}
