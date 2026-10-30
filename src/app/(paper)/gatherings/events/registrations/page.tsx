"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ClipboardList, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import { EmptyState, PersonAvatar, SearchField } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { RegisterAttendeeButton } from "@/components/events/register-attendee-button";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useEventsList,
  useEventRegistrations,
  type EventRegistration,
} from "@/hooks/use-events";
import { formatDate } from "@/hooks/use-media";
import { number } from "@/lib/paper/format";

const STATUS_TONES: Record<string, "moss" | "gold" | "rose" | "neutral"> = {
  paid: "moss",
  pending: "gold",
  failed: "rose",
  cancelled: "neutral",
};

function RegistrationsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, ready } = usePermissions();
  const canRegister = ready && can("events:registrations", "create");

  const [eventId, setEventId] = React.useState(searchParams.get("event") ?? "");
  const [query, setQuery] = React.useState("");

  const events = useEventsList({ limit: 100, sortBy: "startDate", sortOrder: "desc" });
  const registrations = useEventRegistrations(eventId);

  const rows = React.useMemo(() => {
    const all = registrations.data ?? [];
    const q = query.trim().toLowerCase();
    return q
      ? all.filter((r) =>
          [r.memberName, r.tierName, r.ticketCode]
            .some((v) => v?.toLowerCase().includes(q)))
      : all;
  }, [registrations.data, query]);

  const eventList = events.data?.data ?? [];
  const selected = eventList.find((e) => e.eventId === eventId);
  const checkedIn = rows.filter((r) => r.checkedIn || r.ticketCode).length;
  const paid = rows.filter((r) => r.paymentStatus === "paid").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gatherings · Events"
        title="Who&apos;s coming."
        description="Registrations at a glance — who paid, who walked in, and who still needs a first hello."
        actions={
          selected && canRegister ? <RegisterAttendeeButton event={selected} /> : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={eventId}
          onChange={(e) => { setEventId(e.target.value); router.replace(`/gatherings/events/registrations${e.target.value ? `?event=${e.target.value}` : ""}`); }}
          className="h-9 rounded-full border border-line bg-card px-3 text-[11px] outline-none"
          aria-label="Event selector"
        >
          <option value="">Choose an event…</option>
          {eventList.map((event) => (
            <option key={event.eventId} value={event.eventId}>
              {event.title} · {formatDate(event.startDate)}
            </option>
          ))}
        </select>
        {eventId ? (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Search attendees…" className="w-full max-w-[220px]" />
            <span className="ml-auto flex flex-wrap items-center gap-1.5 text-[10px] text-ink-faint">
              {selected?.isFree ? <Tag tone="moss">free event</Tag> : <Tag tone="gold">tickets</Tag>}
              {selected?.capacity ? <span className="num">capacity {number(selected.capacity)}</span> : null}
            </span>
          </>
        ) : null}
      </div>

      {eventId ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Registrations" value={rows.length} tone="terracotta" icon={<ClipboardList className="size-4" />} />
            <StatCard label="Paid" value={paid} tone="moss" />
            <StatCard label="Checked in" value={checkedIn} tone="sky" deltaLabel={rows.length ? `${Math.round((checkedIn / rows.length) * 100)}% of list` : "—"} />            <StatCard label="Awaiting payment" value={rows.filter((r) => r.paymentStatus === "pending").length} tone="gold" />
          </div>

          {registrations.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<UserPlus />}
              title={query ? "Nobody matches that search" : "No registrations yet"}
              description={selected?.isFree ? "Free events fill at the door or with Register Attendee." : "Tickets appear here the moment someone registers."}
              action={selected ? <RegisterAttendeeButton event={selected} /> : null}
            />
          ) : (
            <StaggerGroup className="paper-card divide-y divide-line/70 overflow-hidden rounded-2xl">
              <div className="rule-label grid grid-cols-[minmax(0,1.8fr)_1fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 border-b border-line px-5 py-2.5">
                <span>Attendee</span>
                <span>Tier</span>
                <span className="text-right">Qty</span>
                <span>Payment</span>
                <span>Checked in</span>
                <span className="text-right">Ticket</span>
              </div>
              {rows.map((registration: EventRegistration) => (
                <StaggerItem key={registration.registrationId}>
                  <div className="grid grid-cols-[minmax(0,1.8fr)_1fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 px-5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <PersonAvatar name={registration.memberName ?? "A member"} size="xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium">{registration.memberName ?? `Member ${registration.memberId?.slice(0, 6) ?? "—"}`}</span>
                        <span className="block truncate text-[10px] text-ink-faint">{formatDate(registration.createdAt)}</span>
                      </span>
                    </span>
                    <span className="truncate text-[11px] text-ink-soft">{registration.tierName ?? "General"}</span>
                    <span className="num text-right text-[11px]">{registration.quantity ?? 1}</span>
                    <span><Tag tone={STATUS_TONES[registration.paymentStatus ?? "pending"] ?? "neutral"} dot>{registration.paymentStatus ?? "pending"}</Tag></span>
                    <span className="text-[10px] text-ink-faint">{registration.checkedIn ? "yes" : "not yet"}</span>
                    <span className="truncate text-right font-mono text-[9px] text-ink-faint">{registration.ticketCode ?? "—"}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button type="button" onClick={() => router.push(`/gatherings/events/${eventId}`)} className="flex items-center gap-1.5 text-terracotta hover:underline">
              <CalendarDays className="size-3" /> Open the event
            </button>
            <button type="button" onClick={() => router.push(`/gatherings/events/check-in?event=${encodeURIComponent(eventId)}`)} className="text-terracotta hover:underline">Run check-in</button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ClipboardList />}
          title="Pick an event to see its house"
          description="Registrations, payments and check-ins arrive here the moment a list is chosen."
        />
      )}
    </div>
  );
}

export default function EventRegistrationsPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-6 w-40" /><Skeleton className="h-64 rounded-2xl" /></div>}>
      <RegistrationsInner />
    </Suspense>
  );
}
