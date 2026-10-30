"use client";

import * as React from "react";
import {
  CalendarDays,
  HandCoins,
  RefreshCw,
  Search,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import {
  DataList,
  EmptyState,
  FieldRow,
  FilterChip,
  PersonAvatar,
  SearchField,
} from "@/components/paper/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useVisitorsList,
  useVisitorsStats,
  useUpdateVisitorById,
  type Visitor,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import { VisitorFormDialog } from "@/components/visitors/visitor-form-dialog";
import { ConvertVisitorDialog } from "@/components/visitors/convert-visitor-dialog";
import { DeleteVisitorDialog } from "@/components/visitors/delete-visitor-dialog";
import { useInspector } from "@/components/paper/shell/inspector-provider";

const PAGE_SIZE = 15;

const FOLLOW_UP_OPTIONS: { value: FollowUpStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up_scheduled", label: "Scheduled" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "dropped_off", label: "Dropped off" },
];

const STATUS_TONES: Record<FollowUpStatus, "moss" | "neutral" | "rose" | "sky" | "gold" | "terracotta"> = {
  new: "gold",
  contacted: "sky",
  follow_up_scheduled: "sky",
  interested: "terracotta",
  converted: "moss",
  dropped_off: "neutral",
};

function label(status: FollowUpStatus) {
  return FOLLOW_UP_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function fullName(v: Visitor) {
  return `${v.firstName} ${v.lastName ?? ""}`.trim();
}

export default function VisitorsPage() {
  const { open, close } = useInspector();
  const { can, ready } = usePermissions();
  const canCreate = ready && can("visitors:new", "create");
  const canUpdate = ready && (can("visitors:list", "update") || can("visitors", "update"));
  const canDelete = ready && (can("visitors:list", "delete") || can("visitors", "delete"));

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<FollowUpStatus | "all">("all");
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Visitor | null>(null);
  const [convertTarget, setConvertTarget] = React.useState<Visitor | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Visitor[] | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      followUpStatus: status === "all" ? undefined : status,
    }),
    [page, search, status],
  );

  const list = useVisitorsList(params);
  const stats = useVisitorsStats();
  const updateVisitor = useUpdateVisitorById();

  const rows = list.data?.data ?? [];
  const total = list.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, list.data?.meta?.totalPages ?? 1);

  const peek = (visitor: Visitor) =>
    open({
      eyebrow: `Visitor · ${label(visitor.followUpStatus)}`,
      title: fullName(visitor),
      subtitle: visitor.email ?? visitor.phone ?? "No contact on file",
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <PersonAvatar name={fullName(visitor)} size="lg" />
            <div className="space-y-1.5">
              <Tag tone={STATUS_TONES[visitor.followUpStatus]} dot>{label(visitor.followUpStatus)}</Tag>
              <p className="text-[10px] text-ink-faint">First visit {visitor.firstVisitDate.slice(0, 10)}</p>
            </div>
          </div>
          <DataList>
            {visitor.email ? <FieldRow label="Email">{visitor.email}</FieldRow> : null}
            {visitor.phone ? <FieldRow label="Phone">{visitor.phone}</FieldRow> : null}
            {visitor.whatsappNumber ? <FieldRow label="WhatsApp">{visitor.whatsappNumber}</FieldRow> : null}
            {visitor.assignedToName ? <FieldRow label="Assigned to">{visitor.assignedToName}</FieldRow> : null}
          </DataList>
          {visitor.notes ? (
            <p className="rounded-lg border border-line bg-card p-3 text-[11px] leading-relaxed text-ink-soft">{visitor.notes}</p>
          ) : null}
          {canUpdate ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg border-line text-xs" onClick={() => { close(); setEditTarget(visitor); setFormOpen(true); }}>
                Edit
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-lg border-line text-xs" onClick={() => { close(); setConvertTarget(visitor); }}>
                Convert
              </Button>
              <Button
                size="sm"
                className="col-span-2 h-9 rounded-lg text-xs"
                disabled={updateVisitor.isPending}
                onClick={() =>
                  updateVisitor.mutate(
                    { visitorId: visitor.id, input: { followUpStatus: "contacted" } },
                    { onSuccess: () => toast(`${visitor.firstName} marked as contacted.`) },
                  )
                }
              >
                Mark contacted
              </Button>
            </div>
          ) : null}
        </div>
      ),
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People · Visitors"
        title="Guests in the room."
        description="Every first-time guest, their follow-up status, and who&apos;s carrying the conversation."
        actions={
          canCreate ? (
            <Button className="h-9 gap-1.5 rounded-full text-xs" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
              <UserRoundPlus className="size-3.5" /> Add a guest
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total guests" value={stats.data?.total ?? 0} tone="terracotta" icon={<Users className="size-4" />} />
        <StatCard label="New this month" value={stats.data?.newThisMonth ?? 0} tone="gold" icon={<CalendarDays className="size-4" />} deltaLabel="first visits" />
        <StatCard label="In follow-up" value={stats.data?.inFollowUp ?? 0} tone="sky" icon={<RefreshCw className="size-4" />} />
        <StatCard label="Converted" value={stats.data?.converted ?? 0} tone="moss" icon={<HandCoins className="size-4" />} deltaLabel="now members" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={searchInput} onChange={setSearchInput} placeholder="Search guests…" className="w-full max-w-xs" />
        <FilterChip active={status === "all"} onClick={() => { setStatus("all"); setPage(1); }}>All</FilterChip>
        {FOLLOW_UP_OPTIONS.map((item) => (
          <FilterChip key={item.value} active={status === item.value} onClick={() => { setStatus(item.value); setPage(1); }}>
            {item.label}
          </FilterChip>
        ))}
      </div>

      {list.isError ? (
        <EmptyState icon={<Search />} title="Couldn&apos;t load the register" description="The visitor list didn&apos;t answer." action={<Button size="sm" variant="outline" className="rounded-full border-line text-xs" onClick={() => list.refetch()}>Retry</Button>} />
      ) : list.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No guests match"
          description="Try a different name, or loosen the filter."
          action={<Button variant="outline" size="sm" className="rounded-full border-line text-xs" onClick={() => { setSearchInput(""); setSearch(""); setStatus("all"); setPage(1); }}>Clear filters</Button>}
        />
      ) : (
        <div className="paper-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="rule-label grid grid-cols-[minmax(0,2fr)_1fr_1.1fr_0.9fr_auto] items-center gap-4 border-b border-line px-5 py-2.5">
                <span>Guest</span>
                <span>Status</span>
                <span>First visit</span>
                <span>Assigned</span>
                <span className="text-right">Manage</span>
              </div>
              <div className="divide-y divide-line/70">
                {rows.map((visitor) => (
                  <div key={visitor.id} className="group grid grid-cols-[minmax(0,2fr)_1fr_1.1fr_0.9fr_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40">
                    <button type="button" onClick={() => peek(visitor)} className="flex min-w-0 items-center gap-3 text-left">
                      <PersonAvatar name={fullName(visitor)} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{fullName(visitor)}</span>
                        <span className="block truncate text-[11px] text-ink-faint">{visitor.email ?? visitor.phone ?? "No contact"}</span>
                      </span>
                    </button>
                    <span><Tag tone={STATUS_TONES[visitor.followUpStatus]} dot>{label(visitor.followUpStatus)}</Tag></span>
                    <span className="num text-[11px] text-ink-soft">{visitor.firstVisitDate.slice(0, 10)}</span>
                    <span className="truncate text-[11px] text-ink-faint">{visitor.assignedToName ?? "—"}</span>
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate ? (
                        <button type="button" onClick={() => { setEditTarget(visitor); setFormOpen(true); }} className="rounded-full px-2 py-1 text-[10px] text-terracotta opacity-0 transition-opacity group-hover:opacity-100 hover:underline">
                          Edit
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" onClick={() => setDeleteTarget([visitor])} className="rounded-full px-2 py-1 text-[10px] text-rose opacity-0 transition-opacity group-hover:opacity-100 hover:underline" aria-label="Delete visitor">
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[11px] text-ink-faint">
            <span>Showing <span className="num font-medium text-ink">{(page - 1) * PAGE_SIZE + 1}–{Math.min(total, page * PAGE_SIZE)}</span> of <span className="num font-medium text-ink">{total}</span></span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border-line bg-card">Prev</Button>
              <span className="num">{page} / {totalPages}</span>
              <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-full border-line bg-card">Next</Button>
            </div>
          </div>
        </div>
      )}

      <VisitorFormDialog open={formOpen} onOpenChange={setFormOpen} visitor={editTarget} />
      <ConvertVisitorDialog open={!!convertTarget} onOpenChange={(v) => !v && setConvertTarget(null)} visitor={convertTarget} />
      <DeleteVisitorDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} visitors={deleteTarget ?? []} />
    </div>
  );
}
