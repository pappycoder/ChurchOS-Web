"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BellOff,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  HandCoins,
  HeartHandshake,
  Megaphone,
  Settings2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/paper/section";
import { Tag } from "@/components/paper/stat";
import {
  EmptyState,
  FilterChip,
} from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NOTIFICATION_TYPE_LABELS,
  formatRelativeTime,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationsList,
  type NotificationType,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  system: Settings2,
  attendance: CalendarCheck,
  giving: HandCoins,
  event: CalendarDays,
  pastoral: HeartHandshake,
  broadcast: Megaphone,
};

const TYPE_TONES: Record<NotificationType, "sky" | "moss" | "terracotta" | "gold" | "rose" | "neutral"> = {
  system: "neutral",
  attendance: "moss",
  giving: "terracotta",
  event: "sky",
  pastoral: "rose",
  broadcast: "gold",
};

const FILTERS: { label: string; value: "all" | "unread" }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
];

const TYPES: ("all" | NotificationType)[] = [
  "all",
  "pastoral",
  "giving",
  "event",
  "attendance",
  "broadcast",
  "system",
];

export default function PaperNotificationsPage() {
  const router = useRouter();
  const [read, setRead] = React.useState<"all" | "unread">("all");
  const [type, setType] = React.useState<"all" | NotificationType>("all");

  const list = useNotificationsList({
    page: 1,
    limit: 50,
    read,
    type: type === "all" ? undefined : type,
  });
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const items = list.data?.data ?? [];

  const open = (id: string, readAt: string | undefined, link?: string) => {
    if (!readAt) markRead.mutate(id);
    if (link?.startsWith("/")) router.push(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today"
        title="Notifications"
        description={
          list.data?.unreadCount
            ? `${list.data.unreadCount} things that happened while you were elsewhere.`
            : "Everything is quiet."
        }
        actions={
          <Button
            variant="outline"
            className="h-9 gap-1.5 rounded-full border-line bg-card text-xs"
            disabled={!list.data?.unreadCount || markAll.isPending}
            onClick={() =>
              markAll.mutate(undefined, {
                onSuccess: () => toast("All caught up."),
              })
            }
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <FilterChip key={item.value} active={read === item.value} onClick={() => setRead(item.value)}>
            {item.label}
          </FilterChip>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-line sm:block" />
        {TYPES.map((item) => (
          <FilterChip key={item} active={type === item} onClick={() => setType(item)}>
            <span className="capitalize">{item === "all" ? "all types" : NOTIFICATION_TYPE_LABELS[item] ?? item}</span>
          </FilterChip>
        ))}
      </div>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <StaggerGroup className="paper-card divide-y divide-line/70 overflow-hidden rounded-2xl">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Settings2;
            const link = typeof item.data?.link === "string" ? item.data.link : undefined;
            return (
              <StaggerItem key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item.id, item.readAt, link)}
                  className={cn(
                    "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40",
                    item.readAt && "opacity-70",
                  )}
                >
                  <span className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    TYPE_TONES[item.type] === "terracotta" && "bg-terracotta-soft text-terracotta",
                    TYPE_TONES[item.type] === "moss" && "bg-moss-soft text-moss",
                    TYPE_TONES[item.type] === "gold" && "bg-gold-soft text-gold",
                    TYPE_TONES[item.type] === "sky" && "bg-sky-soft text-sky",
                    TYPE_TONES[item.type] === "rose" && "bg-rose-soft text-rose",
                    TYPE_TONES[item.type] === "neutral" && "bg-muted text-ink-soft",
                  )}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      {item.title}
                      {!item.readAt ? <span className="size-1.5 rounded-full bg-terracotta" /> : null}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{item.body}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Tag tone={TYPE_TONES[item.type] ?? "neutral"}>{NOTIFICATION_TYPE_LABELS[item.type] ?? item.type}</Tag>
                      <span className="text-[10px] text-ink-faint">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={<BellOff />}
          title="Nothing needs you"
          description="The rarest, best screen. New signals land here as they happen."
        />
      )}
    </div>
  );
}
