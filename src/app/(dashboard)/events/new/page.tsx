"use client";

import { BranchAssignmentField, useBranchAssignment } from "@/components/shared/branch-assignment";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateEvent,
  EVENT_TYPES,
  type CreateEventInput,
  type EventType,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const newEventSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    type: z.string().min(1, "Event type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    location: z.string().optional(),
    capacity: z
      .string()
      .optional()
      .refine((v) => !v || Number(v) > 0, "Capacity must be a positive number"),
    isFree: z.boolean(),
    price: z
      .string()
      .optional()
      .refine((v) => !v || Number(v) > 0, "Price must be a positive number"),
  })
  .refine(
    (data) => {
      if (!data.isFree) {
        return !!data.price && Number(data.price) > 0;
      }
      return true;
    },
    { message: "Price is required for paid events", path: ["price"] }
  );

type NewEventFormValues = z.infer<typeof newEventSchema>;

export default function CreateEventPage() {
  const { can } = usePermissions();
  const canCreate = can("events", "create");
  const canManageTickets = can("events:tickets", "create");

  const router = useRouter();
  const createMutation = useCreateEvent();
  const branchAssignment = useBranchAssignment(undefined);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<NewEventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      startDate: "",
      endDate: "",
      location: "",
      capacity: "",
      isFree: true,
      price: "",
    },
  });

  const isFree = form.watch("isFree");

  const onSubmit = async (values: NewEventFormValues) => {
    const branchPayload = branchAssignment.payload();
    if (!branchPayload) return;
    setSaving(true);
    try {
      const input: CreateEventInput = {
        ...branchPayload,
        title: values.title.trim(),
        type: values.type as EventType,
        startDate: values.startDate,
        isFree: values.isFree,
      };

      if (values.description?.trim()) input.description = values.description.trim();
      if (values.endDate) input.endDate = values.endDate;
      if (values.location?.trim()) input.location = values.location.trim();
      if (values.capacity) input.capacity = Number(values.capacity);
      if (!values.isFree && values.price) input.price = Number(values.price);

      await createMutation.mutateAsync(input);
      toast.success("Event created successfully");
      router.push("/events");
    } catch (error) {
      toast.error("Failed to create event", {
        description: getToastErrorMessage(error, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Create Event"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: "Create" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            You do not have permission to create events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Event"
        description="Set up the event, then manage registrations and attendance from its workspace."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Create" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
          <p className="text-sm text-muted-foreground">Fields marked * are required. Optional details can be added later.</p>
          <fieldset className="min-w-0 space-y-5 border-b pb-6">
            <legend className="mb-1 text-lg font-semibold">Event details</legend>
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Youth Conference 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid items-start gap-5 sm:grid-cols-2">
              <BranchAssignmentField assignment={branchAssignment} disabled={saving} />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={(value) => { if (value) field.onChange(value); }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the event, agenda, speakers, etc."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>
          <fieldset className="min-w-0 space-y-5 border-b pb-6">
            <legend className="mb-1 text-lg font-semibold">Schedule and location</legend>
            <div className="grid items-start gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>Optional.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Auditorium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </fieldset>
          <fieldset className="min-w-0 space-y-5 border-b pb-6">
            <legend className="mb-1 text-lg font-semibold">Registration and pricing</legend>
            <div className="max-w-sm">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 500" min="1" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank for unlimited places.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <FormLabel>Free Event</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {canManageTickets ? "Toggle off to set a ticket price." : "Paid events require Network or above and ticket management access."}
                        </p>
                      </div>
                      <FormControl><Switch disabled={!canManageTickets} checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isFree && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 5000" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
          </fieldset>

          <div className="flex items-center justify-end gap-2 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/events")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
