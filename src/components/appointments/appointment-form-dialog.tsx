"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Search, UserRound, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAppointmentContacts,
  useCreateAppointment,
  useUpdateAppointment,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
  type AppointmentContact,
} from "@/hooks/use-appointments";

const APPOINTMENT_SCHEMA = z.object({
  title: z.string().min(1, "Title is required").max(200),
  scheduledAt: z.string().min(1, "Date and time are required"),
  counterpartId: z.string().min(1, "Select a counterpart"),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  status: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof APPOINTMENT_SCHEMA>;

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  senior_pastor: "Senior Pastor",
  church_admin: "Church Admin",
  branch_pastor: "Branch Pastor",
  department_head: "Department Head",
  secretary: "Secretary",
  treasurer: "Treasurer",
  cell_leader: "Cell Leader",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function toLocalDatetime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(datetime: string): string {
  const d = new Date(datetime);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits this appointment; otherwise it creates one. */
  appointment?: Appointment | null;
  onSaved?: () => void;
}

function toFormValues(appointment?: Appointment | null): AppointmentFormValues {
  return {
    title: appointment?.title ?? "",
    scheduledAt: toLocalDatetime(appointment?.scheduledAt),
    counterpartId:
      appointment?.pastorId || appointment?.secretaryId || "",
    location: appointment?.location ?? "",
    notes: appointment?.notes ?? "",
    status: appointment?.status ?? "pending",
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  onSaved,
}: AppointmentFormDialogProps) {
  const isEdit = !!appointment;
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const [search, setSearch] = React.useState("");

  const { data: contacts, isLoading: contactsLoading } = useAppointmentContacts({
    search: search || undefined,
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(APPOINTMENT_SCHEMA),
    defaultValues: toFormValues(appointment),
  });

  const counterpartId = form.watch("counterpartId");

  React.useEffect(() => {
    if (open) {
      setSearch("");
      form.reset(toFormValues(appointment));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment]);

  const pickContact = (contact: AppointmentContact) => {
    form.setValue("counterpartId", contact.id, { shouldValidate: true, shouldDirty: true });
    setSearch("");
  };

  const selectedContact = (contacts?.data ?? []).find((c) => c.id === counterpartId)
    || (appointment ? null : undefined);

  const unselected = (contacts?.data ?? []).filter((c) => c.id !== counterpartId);

  const onSubmit = (values: AppointmentFormValues) => {
    const payload = {
      title: values.title.trim(),
      scheduledAt: toIso(values.scheduledAt),
      location: values.location?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };

    if (isEdit && appointment) {
      const currentPairId = appointment.pastorId || appointment.secretaryId || "";
      updateMutation.mutate(
        {
          id: appointment.id,
          input: {
            ...payload,
            status: values.status,
            ...(values.counterpartId && values.counterpartId !== currentPairId
              ? { counterpartId: values.counterpartId }
              : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success("Appointment updated");
            onOpenChange(false);
            onSaved?.();
          },
          onError: (e) =>
            toast.error("Failed to update appointment", {
              description: e instanceof Error ? e.message : "Please try again.",
            }),
        }
      );
      return;
    }

    createMutation.mutate(
      {
        ...payload,
        counterpartId: values.counterpartId,
        status: values.status || "pending",
      },
      {
        onSuccess: () => {
          toast.success("Appointment booked");
          onOpenChange(false);
          onSaved?.();
        },
        onError: (e) =>
          toast.error("Failed to book appointment", {
            description: e instanceof Error ? e.message : "Please try again.",
          }),
      }
    );
  };

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this appointment's details."
              : "Book a meeting in the registry."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Counterpart picker */}
            <FormField
              control={form.control}
              name="counterpartId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>With (Secretary / Pastor) *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value && (
                        <div className="flex flex-wrap gap-1.5">
                          {field.value && !selectedContact && (
                            <Badge variant="secondary" className="gap-1 pr-1.5">
                              Current assignment
                              <button
                                type="button"
                                onClick={() => field.onChange("", { shouldValidate: true })}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedContact && (
                            <Badge variant="secondary" className="gap-1 pr-1.5">
                              {selectedContact.name}
                              <button
                                type="button"
                                onClick={() => field.onChange("", { shouldValidate: true })}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, role, or branch…"
                          className="pl-8"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>

                      {contactsLoading && (
                        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" /> Loading contacts…
                        </div>
                      )}

                      {!contactsLoading && unselected.length > 0 && (
                        <div className="max-h-44 overflow-y-auto rounded-md border divide-y">
                          {unselected.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => pickContact(c)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                            >
                              <Avatar className="size-8">
                                <AvatarImage src={c.avatarUrl} alt={c.name} />
                                <AvatarFallback>
                                  {initials(c.name) || <UserRound className="size-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{c.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {ROLE_LABEL[c.role] ?? c.role}
                                  {c.branchName ? ` · ${c.branchName}` : ""}
                                </p>
                              </div>
                              <Badge variant="outline" className="flex-none">
                                {c.isPastor ? "Pastor" : "Secretary"}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}

                      {!contactsLoading && search && unselected.length === 0 && field.value && (
                        <p className="text-sm text-muted-foreground">
                          No other matching contacts.
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Budget planning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled date/time */}
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & time *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Campus — Office 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (edit only) */}
            {isEdit && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPOINTMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {APPOINTMENT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      pending · confirmed · completed · cancelled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose / notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What is this appointment about?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {isEdit ? "Save Changes" : "Book Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
