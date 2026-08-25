"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const createMutation = useCreateEvent();
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
    setSaving(true);
    try {
      const input: CreateEventInput = {
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
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Event"
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Event Details */}
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

          {/* Location & Capacity */}
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

          {/* Ticketing */}
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

          {/* Description */}
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

          {/* Footer actions */}
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
