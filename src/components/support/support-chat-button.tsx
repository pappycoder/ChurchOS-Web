"use client";
import { Button } from "@/components/ui/button";
import { useSupportChat } from "./support-chat-provider";

export function SupportChatButton({
  children = "Live chat",
}: {
  children?: React.ReactNode;
}) {
  const { available, openChat } = useSupportChat();
  if (!available) return null;
  return (
    <Button variant="outline" onClick={openChat}>
      {children}
    </Button>
  );
}
