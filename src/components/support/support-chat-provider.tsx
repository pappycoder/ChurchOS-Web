"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchCurrentProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { closeSupportChat, openSupportChat, TAWK_CHAT_URL } from "@/lib/tawk";
import { isPublicHelpPath } from "@/lib/help/paths";
import { matchRoutePermission } from "@/lib/route-permissions";

const SupportChatContext = createContext({ openChat: () => {}, available: false });

export function useSupportChat() {
  return useContext(SupportChatContext);
}

/** One chat session across workspace navigation; no SDK until an admin clicks. */
export function SupportChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const workspace = !!matchRoutePermission(pathname) || isPublicHelpPath(pathname);
  const { data: profile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: fetchCurrentProfile,
    enabled: isAuthenticated && workspace,
    staleTime: 60 * 1000,
  });
  const available =
    isAuthenticated &&
    workspace &&
    profile?.status === "active" &&
    !!profile.role.some((role) => role === "church_admin" || role === "super_admin");
  const scope = available ? `${profile.churchId}:${profile.profileId}` : "";
  const active = useRef("");
  const request = useRef(0);
  const [state, setState] = useState<"idle" | "opening" | "connected">("idle");
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    active.current = scope;
    setEnded(false);
    setState("idle");
    setError("");
    const stop = () => {
      active.current = "";
      setEnded(true);
      request.current++;
      setState("idle");
      setError("");
      closeSupportChat();
    };
    window.addEventListener("churchos-session-ended", stop);
    return () => {
      window.removeEventListener("churchos-session-ended", stop);
      stop();
    };
  }, [scope]);

  async function openChat() {
    if (!available || active.current !== scope || state === "opening") return;
    const current = ++request.current;
    setState("opening");
    setError("");
    try {
      await openSupportChat();
      if (current === request.current && active.current === scope) setState("connected");
    } catch (err) {
      if (current !== request.current || active.current !== scope) return;
      setError(err instanceof Error ? err.message : "Chat is unavailable. Please try again.");
      setState("idle");
    }
  }

  return (
    <SupportChatContext.Provider
      value={{
        openChat: () => {
          void openChat();
        },
        available: available && !ended,
      }}
    >
      {children}
      {available && !ended && (
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6">
          {error && (
            <div className="w-80 max-w-full rounded-xl border bg-card p-4 shadow-lg">
              <div className="flex items-start gap-2">
                <p role="alert" className="flex-1 text-sm">
                  {error}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label="Dismiss support error"
                  onClick={() => setError("")}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <a
                href={TAWK_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"
              >
                Open support in a new tab
                <ExternalLink className="size-4" />
              </a>
            </div>
          )}
          {state !== "connected" && (
            <Button
              className="h-12 rounded-full px-5 shadow-lg"
              onClick={() => void openChat()}
              disabled={state === "opening"}
              aria-label="Chat with support"
            >
              <MessageCircle className="size-5" />
              {state === "opening" ? "Connecting…" : "Chat with support"}
            </Button>
          )}
        </div>
      )}
    </SupportChatContext.Provider>
  );
}
