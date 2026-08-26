"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  useEvent,
  useUpdateEvent,
  EVENT_TYPES,
  type EventType,
} from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";

const editEventSchema = z
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

type EditEventFormValues = z.infer<typeof editEventSchema>;

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const { can } = usePermissions();
  const canUpdate = can("events", "update");

  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const eventQuery = useEvent(eventId);
  const updateMutation = useUpdateEvent(eventId);
  const [saving, setSaving] = React.useState(false);

  const event = eventQuery.data;

  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventSchema),
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

  React.useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description ?? "",
        type: event.type,
        startDate: toDatetimeLocal(event.startDate),
        endDate: event.endDate ? toDatetimeLocal(event.endDate) : "",
        location: event.location ?? "",
        capacity: event.capacity ? String(event.capacity) : "",
        isFree: event.isFree,
        price: event.price != null ? String(event.price) : "",
      });
    }
  }, [event, form]);

  const isFree = form.watch("isFree");

  const onSubmit = async (values: EditEventFormValues) => {
    setSaving(true);
    try {
      const input: Record<string, unknown> = {
        title: values.title.trim(),
        type: values.type as EventType,
        startDate: values.startDate,
        isFree: values.isFree,
      };

      if (values.description?.trim()) input.description = values.description.trim();
      else input.description = null;
      if (values.endDate) input.endDate = values.endDate;
      else input.endDate = null;
      if (values.location?.trim()) input.location = values.location.trim();
      else input.location = null;
      if (values.capacity) input.capacity = Number(values.capacity);
      else input.capacity = null;
      if (!values.isFree && values.price) input.price = Number(values.price);
      else input.price = null;

      await updateMutation.mutateAsync(input as never);
      toast.success("Event updated successfully");
      router.push(`/events/${eventId}`);
    } catch (error) {
      toast.error("Failed to update event", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
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

  if (!canUpdate) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Edit Event"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: "Edit" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            You do not have permission to edit events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Edit: ${event.title}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: event.title, href: `/events/${eventId}` },
          { label: "Edit" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Event Details</CardTitle>
              <CardDescription>Basic information about the event.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Location &amp; Capacity</CardTitle>
              <CardDescription>Where and how many attendees the event can hold.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 500" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ticketing</CardTitle>
              <CardDescription>Configure whether this event is free or paid.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label className="font-medium">Free Event</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Toggle off to set a ticket price.
                        </p>
                      </div>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Description</CardTitle>
              <CardDescription>
                Additional details about the event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
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
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 pb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/events/${eventId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
