"use client";
import { ErrorState } from "@/components/shared/error-state";
import { AvailableSelect } from "@/components/shared/available-select";
import { BranchFilter } from "@/components/shared/branch-filter";

import * as React from "react";
import { format } from "date-fns";
import { toast, getToastErrorMessage } from "@/lib/toast";
import {
  Plus,
  Ticket,
  Pencil,
  Trash2,
  Download,
  DollarSign,
  Users,
  Loader2,
  Search,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { UrlTabs } from "@/components/shared/url-tabs";
import {
  EventsHeader as PageHeader,
  eventsWorkspaceClass,
  EventsFormSection,
  EventRowActions,
  EventStateBadge,
} from "@/components/events/event-presentation";
import { TableCard } from "@/components/shared/table-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAllTickets,
  useEventsSummary,
  useEventTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  useCreateTicket,
  type EventItem,
  type EventTicketTier,
  type AllTicketItem,
} from "@/hooks/use-events";
import { MemberCombobox } from "@/components/members/member-combobox";
import { VisitorCombobox } from "@/components/visitors/visitor-combobox";
import { useCreateVisitor } from "@/hooks/use-visitors";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useExportBranding } from "@/hooks/use-export-branding";
import { useIsTicketMember } from "@/hooks/use-is-member";

// ─── Status Badge ─────────────────────────────────────────

const TicketStatusBadge = EventStateBadge;

// ─── Main Page ────────────────────────────────────────────

export default function ManagementPage() {
  const { can } = usePermissions();
  const { isTicketMember } = useIsTicketMember();
  const canCreate = can("events:tickets", "create");

  const canManageTypes =
    canCreate ||
    can("events:tickets", "update") ||
    can("events:tickets", "delete");

  // Members and cell group leaders share the member-like ticket surface, so
  // both get the "My Tickets" title.
  const title = isTicketMember ? "My Tickets" : "Tickets";

  return (
    <div className={`${eventsWorkspaceClass} space-y-4`}>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: title },
        ]}
      />

      <UrlTabs
        defaultValue={canManageTypes ? "types" : "assigned"}
        values={canManageTypes ? ["types", "assigned"] : ["assigned"]}
      >
        {canManageTypes && (
          <TabsList aria-label="Ticket workspace">
            <TabsTrigger value="types">Ticket Types</TabsTrigger>
            <TabsTrigger value="assigned">Assigned Tickets</TabsTrigger>
          </TabsList>
        )}

        {canManageTypes && (
          <TabsContent
            value="types"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <TicketTypesTab />
          </TabsContent>
        )}

        <TabsContent
          value="assigned"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <AssignedTicketsTab />
        </TabsContent>
      </UrlTabs>
    </div>
  );
}

// ─── Tab 1: Ticket Types ──────────────────────────────────

interface TierFormData {
  name: string;
  price: string;
  capacity: string;
  description: string;
}

const defaultTierForm: TierFormData = {
  name: "",
  price: "",
  capacity: "",
  description: "",
};

function TicketTypesTab() {
  const { can } = usePermissions();
  const tierActionRef = React.useRef<HTMLButtonElement | null>(null);
  const canCreate = can("events:tickets", "create");
  const canUpdate = can("events:tickets", "update");
  const canDelete = can("events:tickets", "delete");

  const eventsQuery = useEventsSummary();
  const events = eventsQuery.data?.data ?? [];

  const [selectedEventId, setSelectedEventId] = React.useState("");
  const tiersQuery = useEventTiers(selectedEventId);
  const createTier = useCreateTier(selectedEventId);
  const updateTier = useUpdateTier(selectedEventId);
  const deleteTier = useDeleteTier(selectedEventId);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<EventTicketTier | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    React.useState<EventTicketTier | null>(null);
  const [form, setForm] = React.useState<TierFormData>(defaultTierForm);
  const [saving, setSaving] = React.useState(false);

  const tiers = tiersQuery.data ?? [];

  const openCreate = () => {
    tierActionRef.current = null;
    setEditingTier(null);
    setForm(defaultTierForm);
    setDialogOpen(true);
  };

  const openEdit = (tier: EventTicketTier) => {
    setEditingTier(tier);
    setForm({
      name: tier.name,
      price: String(tier.price),
      capacity: tier.capacity != null ? String(tier.capacity) : "",
      description: tier.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Tier name is required");
      return;
    }
    const price = Number(form.price);
    if (!price || price < 0) {
      toast.error("Price must be a positive number");
      return;
    }

    setSaving(true);
    try {
      if (editingTier) {
        await updateTier.mutateAsync({
          tierId: editingTier.id,
          input: {
            name: form.name.trim(),
            price,
            capacity: form.capacity ? Number(form.capacity) : null,
            description: form.description.trim() || null,
          },
        });
        toast.success("Tier updated");
      } else {
        await createTier.mutateAsync({
          name: form.name.trim(),
          price,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          description: form.description.trim() || undefined,
        });
        toast.success("Tier created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save tier", {
        description: getToastErrorMessage(err, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTier.mutateAsync(deleteTarget.id);
      toast.success(`Tier "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete tier", {
        description: getToastErrorMessage(err, "Please try again."),
      });
    }
  };

  return (
    <TableCard
      title={
        <span className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Ticket Types{" "}
          <span className="text-xs font-normal tabular-nums text-muted-foreground">
            {selectedEventId && !tiersQuery.isLoading && !tiersQuery.isError
              ? `(${tiers.length})`
              : ""}
          </span>
        </span>
      }
      description="Create and manage ticket types (inventory) for your events."
      action={
        canCreate && (
          <Button onClick={openCreate} disabled={!selectedEventId}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket Type
          </Button>
        )
      }
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AvailableSelect
            disabled={eventsQuery.isLoading}
            unavailableMessage={
              eventsQuery.isError
                ? "Unable to load events. Please try again."
                : events.length === 0
                  ? "No events are available for ticket types."
                  : undefined
            }
            value={selectedEventId}
            onValueChange={setSelectedEventId}
          >
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.eventId} value={ev.eventId}>
                  {ev.title}
                </SelectItem>
              ))}
            </SelectContent>
          </AvailableSelect>
        </div>
      }
    >
      {!selectedEventId ? (
        <div className="text-center py-8 text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select an event to manage its ticket types.</p>
        </div>
      ) : tiersQuery.isError ? (
        <ErrorState
          title="Unable to load ticket types"
          onRetry={() => {
            void tiersQuery.refetch();
          }}
        />
      ) : tiersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No ticket types yet.</p>
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Type
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price (NGN)</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Description</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell className="font-medium">{tier.name}</TableCell>
                <TableCell className="text-right">
                  <span className="whitespace-nowrap font-medium tabular-nums">
                    NGN{" "}
                    {tier.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  {tier.capacity != null ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {tier.capacity}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Unlimited
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {tier.description || "-"}
                </TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell className="text-right">
                    <EventRowActions
                      label={`Manage ${tier.name}`}
                      returnFocusRef={tierActionRef}
                      actions={[
                        ...(canUpdate
                          ? [
                              {
                                label: "Edit tier",
                                icon: Pencil,
                                onSelect: () => openEdit(tier),
                              },
                            ]
                          : []),
                        ...(canDelete
                          ? [
                              {
                                label: "Delete tier",
                                icon: Trash2,
                                destructive: true,
                                onSelect: () => setDeleteTarget(tier),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`${eventsWorkspaceClass} max-h-[90dvh] overflow-y-auto`}
          onCloseAutoFocus={(event) => {
            if (tierActionRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => tierActionRef.current?.focus());
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Edit Ticket Type" : "Create Ticket Type"}
            </DialogTitle>
            <DialogDescription>
              {editingTier
                ? "Update the ticket type details below."
                : "Create a new ticket type for this event."}
            </DialogDescription>
          </DialogHeader>
          <EventsFormSection title="Ticket details">
            <div className="space-y-2">
              <Label htmlFor="tier-name">Name *</Label>
              <Input
                id="tier-name"
                placeholder="e.g. VIP, General, Student"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier-price">Price (₦) *</Label>
                <Input
                  id="tier-price"
                  type="number"
                  placeholder="e.g. 5000"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-capacity">Capacity</Label>
                <Input
                  id="tier-capacity"
                  type="number"
                  placeholder="Unlimited"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier-desc">Description</Label>
              <Textarea
                id="tier-desc"
                placeholder="Optional description"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </EventsFormSection>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTier ? "Save Changes" : "Create Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className={`${eventsWorkspaceClass} max-h-[90dvh] overflow-y-auto`}
          onCloseAutoFocus={(event) => {
            if (tierActionRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => tierActionRef.current?.focus());
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Ticket Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteTier.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTier.isPending}
              loading={deleteTier.isPending}
            >
              {deleteTier.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TableCard>
  );
}

// ─── Tab 2: Assigned Tickets ──────────────────────────────

function AssignedTicketsTab() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const canCreate = can("events:tickets", "create");
  const [branchId, setBranchId] = React.useState("");

  const [eventFilter, setEventFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [claimOpen, setClaimOpen] = React.useState(false);

  const eventsQuery = useEventsSummary(branchId || undefined);
  const events = eventsQuery.data?.data ?? [];

  const ticketsQuery = useAllTickets({
    branchId: branchId || undefined,
    eventId: eventFilter || undefined,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    limit,
  });

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const tickets = ticketsQuery.data?.data ?? [];
  const total = ticketsQuery.data?.total ?? 0;

  return (
    <TableCard
      title={
        <span className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Assigned Tickets
        </span>
      }
      description="View and manage individual tickets assigned to members."
      action={
        canCreate ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setClaimOpen(true)}>
              <Ticket className="h-4 w-4 mr-2" />
              Claim for Myself
            </Button>
            <Button onClick={() => setAssignOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Ticket
            </Button>
          </div>
        ) : (
          <Button onClick={() => setClaimOpen(true)}>
            <Ticket className="h-4 w-4 mr-2" />
            Claim a Ticket
          </Button>
        )
      }
      itemName="tickets"
      page={page}
      perPage={limit}
      total={total}
      onPageChange={setPage}
      onPerPageChange={(newLimit) => {
        setLimit(newLimit);
        setPage(1);
      }}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <BranchFilter
            value={branchId}
            onChange={(value) => {
              setBranchId(value);
              setEventFilter("");
              setPage(1);
            }}
          />
          <Input
            placeholder="Search by ticket code or member name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={eventFilter}
            onValueChange={(v) => {
              setEventFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.eventId} value={ev.eventId}>
                  {ev.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      {ticketsQuery.isError ? (
        <ErrorState
          title="Unable to load tickets"
          onRetry={() => {
            void ticketsQuery.refetch();
          }}
        />
      ) : ticketsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tickets found.</p>
        </div>
      ) : (
        <Table exportable>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Attendee</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Price (NGN)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TicketRow key={ticket.ticketId} ticket={ticket} />
            ))}
          </TableBody>
        </Table>
      )}

      <AssignTicketDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        events={events}
      />

      <ClaimTicketDialog
        open={claimOpen}
        onOpenChange={setClaimOpen}
        events={events}
        assignedEventIds={assignedEventIds(
          tickets.filter((ticket) => ticket.memberId === profile?.memberId),
        )}
      />
    </TableCard>
  );
}

function assignedEventIds(tickets: AllTicketItem[]): Set<string> {
  return new Set(
    tickets
      .filter((t) => t.status !== "cancelled" && t.status !== "refunded")
      .map((t) => t.eventId),
  );
}

// ─── Ticket Row ───────────────────────────────────────────

function TicketRow({ ticket }: { ticket: AllTicketItem }) {
  const [downloading, setDownloading] = React.useState(false);
  const resolveBranding = useExportBranding();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await (
        await import("@/lib/ticket-pdf")
      ).generateTicketPDF(ticket, await resolveBranding());
      toast.success("Ticket PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{ticket.code}</TableCell>
      <TableCell>
        <div>
          <span className="font-medium text-sm">{ticket.eventName}</span>
          <p className="text-xs text-muted-foreground">
            {format(new Date(ticket.eventDate), "MMM d, yyyy")}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {ticket.memberName ? (
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            {ticket.memberName}
          </span>
        ) : ticket.visitorName ? (
          <span className="flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-purple-500" />
            {ticket.visitorName}
            <Badge
              variant="outline"
              className="text-[10px] ml-1 border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-200"
            >
              Visitor
            </Badge>
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{ticket.tierName || "-"}</TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {ticket.pricePaid != null
          ? `NGN ${ticket.pricePaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "Free"}
      </TableCell>
      <TableCell>
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell>
        {ticket.isUsed ? (
          <EventStateBadge status="Used" />
        ) : (
          <EventStateBadge status="Unused" />
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          disabled={downloading}
          title="Download ticket PDF"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Assign Ticket Dialog ─────────────────────────────────

function AssignTicketDialog({
  open,
  onOpenChange,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventItem[];
}) {
  const { can } = usePermissions();
  const canCreateVisitor = can("visitors:new", "create");

  const [selectedEventId, setSelectedEventId] = React.useState("");
  const [selectedTierId, setSelectedTierId] = React.useState("");
  const [assigneeType, setAssigneeType] = React.useState<"member" | "visitor">(
    "member",
  );

  // Member selection
  const [selectedMemberId, setSelectedMemberId] = React.useState("");
  const [selectedMemberName, setSelectedMemberName] = React.useState("");

  // Visitor selection
  const [selectedVisitorId, setSelectedVisitorId] = React.useState("");
  const [selectedVisitorName, setSelectedVisitorName] = React.useState("");

  // New visitor form
  const [showNewVisitor, setShowNewVisitor] = React.useState(false);
  const [newVisitor, setNewVisitor] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const createVisitor = useCreateVisitor();

  const createTicket = useCreateTicket();
  const tiersQuery = useEventTiers(selectedEventId);

  const tiers = React.useMemo(() => {
    if (!selectedEventId) return [] as EventTicketTier[];
    return tiersQuery.data ?? [];
  }, [selectedEventId, tiersQuery.data]);

  const selectedEvent = React.useMemo(
    () => events.find((e) => e.eventId === selectedEventId),
    [events, selectedEventId],
  );

  React.useEffect(() => {
    if (open) {
      setSelectedEventId("");
      setSelectedTierId("");
      setAssigneeType("member");
      setSelectedMemberId("");
      setSelectedMemberName("");
      setSelectedVisitorId("");
      setSelectedVisitorName("");
      setShowNewVisitor(false);
      setNewVisitor({ firstName: "", lastName: "", phone: "", email: "" });
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedTierId("");
  }, [selectedEventId]);

  const hasSelectedVisitor =
    (assigneeType === "visitor" && selectedVisitorId) ||
    (assigneeType === "visitor" &&
      showNewVisitor &&
      newVisitor.firstName.trim());

  const canSubmit =
    selectedEventId &&
    ((assigneeType === "member" && selectedMemberId) ||
      (assigneeType === "visitor" && hasSelectedVisitor)) &&
    !createTicket.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      let visitorId = selectedVisitorId;

      // Create new visitor if needed
      if (
        assigneeType === "visitor" &&
        showNewVisitor &&
        newVisitor.firstName.trim()
      ) {
        const created = await createVisitor.mutateAsync({
          firstName: newVisitor.firstName.trim(),
          lastName: newVisitor.lastName.trim() || undefined,
          phone: newVisitor.phone.trim() || undefined,
          email: newVisitor.email.trim() || undefined,
        });
        visitorId = created.id;
      }

      const input =
        assigneeType === "member"
          ? { memberId: selectedMemberId, tierId: selectedTierId || undefined }
          : { visitorId, tierId: selectedTierId || undefined };

      await createTicket.mutateAsync({
        eventId: selectedEventId,
        input,
      });
      toast.success("Ticket assigned successfully");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getToastErrorMessage(err, "Failed to assign ticket"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${eventsWorkspaceClass} max-h-[90dvh] overflow-y-auto sm:max-w-[540px]`}
      >
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign a ticket to a member or visitor. This creates an individual
            ticket with a unique code.
          </DialogDescription>
        </DialogHeader>

        <EventsFormSection title="Event and ticket">
          <div className="space-y-2">
            <Label>Event *</Label>
            <AvailableSelect
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              unavailableMessage={
                events.length === 0
                  ? "No events are available to assign tickets. Please try again later."
                  : undefined
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    {ev.title}
                    {ev.isFree
                      ? " (Free)"
                      : ` (₦${ev.price?.toLocaleString() ?? 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </AvailableSelect>
          </div>

          {selectedEvent && !selectedEvent.isFree && tiers.length > 0 && (
            <div className="space-y-2">
              <Label>Ticket Type</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tiers[0]?.name ?? "Select a type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} — ₦{tier.price.toLocaleString()}
                      {tier.capacity != null && ` (${tier.capacity} capacity)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </EventsFormSection>
        <EventsFormSection title="Ticket holder">
          {/* Assignee Type Toggle */}
          <div className="space-y-2">
            <Label>Assign To *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                aria-pressed={assigneeType === "member"}
                variant={assigneeType === "member" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setAssigneeType("member")}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Member
              </Button>
              <Button
                type="button"
                aria-pressed={assigneeType === "visitor"}
                variant={assigneeType === "visitor" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setAssigneeType("visitor")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Visitor
              </Button>
            </div>
          </div>

          {/* Member Selector */}
          {assigneeType === "member" && (
            <div className="space-y-2">
              <Label>Member *</Label>
              <MemberCombobox
                value={selectedMemberId}
                onChange={(id, member) => {
                  setSelectedMemberId(id);
                  setSelectedMemberName(
                    member ? `${member.firstName} ${member.lastName}` : "",
                  );
                }}
                selectedName={selectedMemberName}
                placeholder="Search for a member..."
              />
            </div>
          )}

          {/* Visitor Selector */}
          {assigneeType === "visitor" && (
            <div className="space-y-2">
              {!showNewVisitor ? (
                <>
                  <Label>Visitor *</Label>
                  <VisitorCombobox
                    value={selectedVisitorId}
                    onChange={(id, visitor) => {
                      setSelectedVisitorId(id);
                      setSelectedVisitorName(
                        visitor
                          ? `${visitor.firstName} ${visitor.lastName ?? ""}`.trim()
                          : "",
                      );
                    }}
                    selectedName={selectedVisitorName}
                    placeholder="Search for a visitor..."
                  />
                  {canCreateVisitor && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setShowNewVisitor(true)}
                    >
                      + Register new visitor
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label>New Visitor *</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setShowNewVisitor(false);
                        setSelectedVisitorId("");
                        setSelectedVisitorName("");
                      }}
                    >
                      Select existing visitor
                    </Button>
                  </div>
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="nv-first" className="text-xs">
                          First Name *
                        </Label>
                        <Input
                          id="nv-first"
                          value={newVisitor.firstName}
                          onChange={(e) =>
                            setNewVisitor({
                              ...newVisitor,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nv-last" className="text-xs">
                          Last Name
                        </Label>
                        <Input
                          id="nv-last"
                          value={newVisitor.lastName}
                          onChange={(e) =>
                            setNewVisitor({
                              ...newVisitor,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="nv-phone" className="text-xs">
                          Phone
                        </Label>
                        <Input
                          id="nv-phone"
                          value={newVisitor.phone}
                          onChange={(e) =>
                            setNewVisitor({
                              ...newVisitor,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="nv-email" className="text-xs">
                          Email
                        </Label>
                        <Input
                          id="nv-email"
                          type="email"
                          value={newVisitor.email}
                          onChange={(e) =>
                            setNewVisitor({
                              ...newVisitor,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </EventsFormSection>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createTicket.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createTicket.isPending ? "Assigning..." : "Assign Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Claim Ticket Dialog (member self-assign) ─────────────

function ClaimTicketDialog({
  open,
  onOpenChange,
  events,
  assignedEventIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: EventItem[];
  assignedEventIds: Set<string>;
}) {
  const { data: currentProfile } = useCurrentProfile();

  const [selectedEventId, setSelectedEventId] = React.useState("");
  const [eventSelectOpen, setEventSelectOpen] = React.useState(false);
  const [selectedTierId, setSelectedTierId] = React.useState("");

  const eligibleEvents = React.useMemo(() => {
    // Cell group leaders are treated exactly like members for tickets: the
    // backend self-claim path lets them take their own branch's events or
    // church-wide (null-branch) events. No strict-branch pinning.
    if (currentProfile?.isAdminHq) return events;
    if (!currentProfile?.branchId) {
      // No branch on record — fall back to church-wide events only.
      return events.filter((e) => !e.branchId);
    }
    // Members can only claim tickets for events in their own branch,
    // or church-wide events (no branch). Already-having a ticket is blocked below.
    return events.filter(
      (e) => !e.branchId || e.branchId === currentProfile.branchId,
    );
  }, [events, currentProfile?.branchId, currentProfile?.isAdminHq]);

  const claimableEvents = eligibleEvents.filter(
    (e) => !assignedEventIds.has(e.eventId),
  );

  const createTicket = useCreateTicket();
  const tiersQuery = useEventTiers(selectedEventId);

  const tiers = React.useMemo(() => {
    if (!selectedEventId) return [] as EventTicketTier[];
    return tiersQuery.data ?? [];
  }, [selectedEventId, tiersQuery.data]);

  const selectedEvent = React.useMemo(
    () => claimableEvents.find((e) => e.eventId === selectedEventId),
    [claimableEvents, selectedEventId],
  );

  React.useEffect(() => {
    if (open) {
      setEventSelectOpen(false);
      setSelectedEventId("");
      setSelectedTierId("");
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedTierId("");
  }, [selectedEventId]);

  const requiresTier =
    !!selectedEvent && !selectedEvent.isFree && tiers.length > 0;

  const canSubmit =
    !!selectedEventId &&
    (!requiresTier || !!selectedTierId) &&
    !createTicket.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await createTicket.mutateAsync({
        eventId: selectedEventId,
        input: {
          memberId: currentProfile?.memberId,
          tierId: selectedTierId || undefined,
        },
      });
      toast.success("Ticket claimed successfully");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getToastErrorMessage(err, "Failed to claim ticket"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${eventsWorkspaceClass} max-h-[90dvh] overflow-y-auto sm:max-w-[540px]`}
      >
        <DialogHeader>
          <DialogTitle>Claim a Ticket</DialogTitle>
          <DialogDescription>
            Claim an available ticket for yourself. You can hold at most one
            ticket per event, for events in your branch.
          </DialogDescription>
        </DialogHeader>

        <EventsFormSection title="Event and ticket">
          <div className="space-y-2">
            <Label>Event *</Label>
            <Select
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              open={eventSelectOpen}
              onOpenChange={(nextOpen) => {
                if (nextOpen && claimableEvents.length === 0) {
                  toast.error("No tickets are available to claim.", {
                    description:
                      "You may already hold a ticket for each eligible event.",
                  });
                  return;
                }
                setEventSelectOpen(nextOpen);
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    claimableEvents.length === 0
                      ? "No available tickets"
                      : "Select an event"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {claimableEvents.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    {ev.title}
                    {ev.isFree
                      ? " (Free)"
                      : ` (₦${ev.price?.toLocaleString() ?? 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your ticket will be assigned to your member profile. If you have
              no linked profile yet, one is created automatically on claim.
            </p>
          </div>

          {selectedEvent && !selectedEvent.isFree && tiers.length > 0 && (
            <div className="space-y-2">
              <Label>Ticket Type</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={tiers[0]?.name ?? "Select a type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} — ₦{tier.price.toLocaleString()}
                      {tier.capacity != null && ` (${tier.capacity} capacity)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </EventsFormSection>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createTicket.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createTicket.isPending ? "Claiming..." : "Claim Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
