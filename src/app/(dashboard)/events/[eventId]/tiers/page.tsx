"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  DollarSign,
  Users,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useEvent,
  useEventTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  type EventTicketTier,
} from "@/hooks/use-events";

interface TierFormData {
  name: string;
  price: string;
  capacity: string;
  description: string;
}

const defaultFormData: TierFormData = {
  name: "",
  price: "",
  capacity: "",
  description: "",
};

export default function EventTiersPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const eventQuery = useEvent(eventId);
  const tiersQuery = useEventTiers(eventId);
  const createTier = useCreateTier(eventId);
  const updateTier = useUpdateTier(eventId);
  const deleteTier = useDeleteTier(eventId);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<EventTicketTier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EventTicketTier | null>(null);
  const [form, setForm] = React.useState<TierFormData>(defaultFormData);
  const [saving, setSaving] = React.useState(false);

  const event = eventQuery.data;
  const tiers = tiersQuery.data ?? [];

  const openCreate = () => {
    setEditingTier(null);
    setForm(defaultFormData);
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

  if (eventQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Event Not Found"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: "Not Found" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Ticket Tiers: ${event.title}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: event.title, href: `/events/${eventId}` },
          { label: "Tiers" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Pricing Tiers</CardTitle>
          <CardDescription>
            {tiers.length === 0
              ? "No tiers configured. Add a tier to set pricing for this event."
              : `${tiers.length} tier(s) configured for this event.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No ticket tiers yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Tier
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(tier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(tier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Tier" : "Add Tier"}</DialogTitle>
            <DialogDescription>
              {editingTier
                ? "Update the tier details below."
                : "Create a new pricing tier for this event."}
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
            <div className="grid grid-cols-2 gap-4">
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
                placeholder="Optional tier description"
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
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingTier ? "Save Changes" : "Create Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tier</DialogTitle>
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
    </div>
  );
}
