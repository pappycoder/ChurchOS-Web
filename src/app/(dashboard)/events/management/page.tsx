"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
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
import { PageHeader } from "@/components/shared/page-header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { generateTicketPDF } from "@/lib/ticket-pdf";

// ─── Status Badge ─────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  refunded: "bg-red-100 text-red-800 border-red-200",
};

function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_COLORS[status] ?? ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ManagementPage() {
  const { ready, can } = usePermissions();
  const canCreate = can("events", "create");

  return (
    <div className="space-y-4">
      <PageHeader
        title={canCreate ? "Tickets" : "My Tickets"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: canCreate ? "Tickets" : "My Tickets" },
        ]}
      />

      <Tabs defaultValue={canCreate ? "types" : "assigned"}>
        {canCreate && (
          <TabsList>
            <TabsTrigger value="types">Ticket Types</TabsTrigger>
            <TabsTrigger value="assigned">Assigned Tickets</TabsTrigger>
          </TabsList>
        )}

        {canCreate && (
          <TabsContent value="types">
            <TicketTypesTab />
          </TabsContent>
        )}

        <TabsContent value="assigned">
          <AssignedTicketsTab />
        </TabsContent>
      </Tabs>
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
  const canCreate = can("events", "create");
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");

  const eventsQuery = useEventsSummary();
  const events = eventsQuery.data?.data ?? [];

  const [selectedEventId, setSelectedEventId] = React.useState("");
  const tiersQuery = useEventTiers(selectedEventId);
  const createTier = useCreateTier(selectedEventId);
  const updateTier = useUpdateTier(selectedEventId);
  const deleteTier = useDeleteTier(selectedEventId);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<EventTicketTier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EventTicketTier | null>(null);
  const [form, setForm] = React.useState<TierFormData>(defaultTierForm);
  const [saving, setSaving] = React.useState(false);

  const tiers = tiersQuery.data ?? [];

  const openCreate = () => {
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
        description: err instanceof Error ? err.message : "Please try again.",
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
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <TableCard
      title={
        <span className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Ticket Types
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
          <Select
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
          </Select>
        </div>
      }
    >
        {!selectedEventId ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an event to manage its ticket types.</p>
          </div>
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
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
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
                  <TableHead>Price</TableHead>
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
                    <TableCell>
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {tier.price.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tier.capacity != null ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {tier.capacity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unlimited</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {tier.description || "-"}
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(tier)}
                              aria-label="Edit tier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(tier)}
                              aria-label="Delete tier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Ticket Type" : "Create Ticket Type"}</DialogTitle>
            <DialogDescription>
              {editingTier
                ? "Update the ticket type details below."
                : "Create a new ticket type for this event."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
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
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action
              cannot be undone.
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
  const canCreate = can("events", "create");

  const [eventFilter, setEventFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(25);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [claimOpen, setClaimOpen] = React.useState(false);

  const eventsQuery = useEventsSummary();
  const events = eventsQuery.data?.data ?? [];

  const ticketsQuery = useAllTickets({
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
          <Button onClick={() => setAssignOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Ticket
          </Button>
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
        {ticketsQuery.isLoading ? (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Price</TableHead>
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
        assignedEventIds={assignedEventIds(tickets)}
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateTicketPDF(ticket);
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
            <Badge variant="outline" className="text-[10px] ml-1 bg-purple-50 text-purple-700 border-purple-200">
              Visitor
            </Badge>
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{ticket.tierName || "-"}</TableCell>
      <TableCell className="text-sm">
        {ticket.pricePaid != null
          ? `₦${ticket.pricePaid.toLocaleString()}`
          : "Free"}
      </TableCell>
      <TableCell>
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell>
        {ticket.isUsed ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Used
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-500">
            Unused
          </Badge>
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
  const canCreateVisitor = can("visitors", "create");

  const [selectedEventId, setSelectedEventId] = React.useState("");
  const [selectedTierId, setSelectedTierId] = React.useState("");
  const [assigneeType, setAssigneeType] = React.useState<"member" | "visitor">("member");

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
    (assigneeType === "visitor" && showNewVisitor && newVisitor.firstName.trim());

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
      if (assigneeType === "visitor" && showNewVisitor && newVisitor.firstName.trim()) {
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
      const message =
        err instanceof Error ? err.message : "Failed to assign ticket";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign a ticket to a member or visitor. This creates an individual ticket with a unique code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Event *</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    {ev.title}
                    {ev.isFree ? " (Free)" : ` (₦${ev.price?.toLocaleString() ?? 0})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && !selectedEvent.isFree && tiers.length > 0 && (
            <div className="space-y-2">
              <Label>Ticket Type</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger>
                  <SelectValue placeholder={tiers[0]?.name ?? "Select a type"} />
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

          {/* Assignee Type Toggle */}
          <div className="space-y-2">
            <Label>Assign To *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
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
                            setNewVisitor({ ...newVisitor, firstName: e.target.value })
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
                            setNewVisitor({ ...newVisitor, lastName: e.target.value })
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
                            setNewVisitor({ ...newVisitor, phone: e.target.value })
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
                            setNewVisitor({ ...newVisitor, email: e.target.value })
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
        </div>

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
  const [selectedTierId, setSelectedTierId] = React.useState("");

  const eligibleEvents = React.useMemo(() => {
    if (!currentProfile?.branchId) {
      // No branch on record — fall back to church-wide events only.
      return events.filter((e) => !e.branchId);
    }
    // Members can only claim tickets for events in their own branch,
    // or church-wide events (no branch). Already-having a ticket is blocked below.
    return events.filter(
      (e) => !e.branchId || e.branchId === currentProfile.branchId,
    );
  }, [events, currentProfile?.branchId]);

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
      setSelectedEventId("");
      setSelectedTierId("");
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedTierId("");
  }, [selectedEventId]);

  const canSubmit = !!selectedEventId && !createTicket.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !currentProfile?.memberId) return;

    try {
      await createTicket.mutateAsync({
        eventId: selectedEventId,
        input: {
          memberId: currentProfile.memberId,
          tierId: selectedTierId || undefined,
        },
      });
      toast.success("Ticket claimed successfully");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to claim ticket";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Claim a Ticket</DialogTitle>
          <DialogDescription>
            Claim an available ticket for yourself. You can hold at most one ticket
            per event, for events in your branch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Event *</Label>
            <Select
              value={selectedEventId}
              onValueChange={setSelectedEventId}
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
                {claimableEvents.length === 0 && (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    No events available to claim. You may already hold a ticket
                    for each eligible event.
                  </div>
                )}
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
            {!currentProfile?.memberId && (
              <p className="text-xs text-muted-foreground">
                No linked member profile found. Contact your church admin to
                assign a ticket.
              </p>
            )}
          </div>

          {selectedEvent && !selectedEvent.isFree && tiers.length > 0 && (
            <div className="space-y-2">
              <Label>Ticket Type</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger>
                  <SelectValue placeholder={tiers[0]?.name ?? "Select a type"} />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} — ₦{tier.price.toLocaleString()}
                      {tier.capacity != null &&
                        ` (${tier.capacity} capacity)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createTicket.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || !currentProfile?.memberId}
          >
            {createTicket.isPending ? "Claiming..." : "Claim Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
