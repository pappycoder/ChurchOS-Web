"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import * as React from "react";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  useCreateBroadcast,
  BROADCAST_CHANNELS,
  BROADCAST_CHANNEL_LABELS,
  MEMBER_STATUS_LABELS,
  type BroadcastChannel,
  type MemberStatus,
} from "@/hooks/use-broadcasts";
import { useTemplatesList } from "@/hooks/use-templates";
import {
  BranchAssignmentField,
  useBranchAssignment,
} from "@/components/shared/branch-assignment";
import { usePermissions } from "@/hooks/use-permissions";

const broadcastSchema = z.object({
  name: z.string().min(1, "Broadcast name is required"),
  channel: z.enum(
    BROADCAST_CHANNELS as [BroadcastChannel, ...BroadcastChannel[]],
    {
      error: (issue) =>
        issue.input === undefined ? "Channel is required" : undefined,
    },
  ),
  templateId: z.string().min(1, "Select a template"),
  memberStatus: z.string().optional(),
  branchId: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  scheduledAt: z.string().optional(),
});

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

export default function NewBroadcastPage() {
  const { data: profile } = useCurrentProfile();
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("broadcasts", "create");
  const createMutation = useCreateBroadcast();

  const [channel, setChannel] = React.useState<BroadcastChannel>("email");
  const branchAssignment = useBranchAssignment();
  const templatesQuery = useTemplatesList({
    status: "published",
    limit: 100,
    branchId: branchAssignment.value || undefined,
  });

  const templates = React.useMemo(
    () =>
      (templatesQuery.data?.data ?? []).filter(
        (t) =>
          t.channel === channel &&
          (!t.branchId || t.branchId === branchAssignment.value),
      ),
    [templatesQuery.data, channel, branchAssignment.value],
  );

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      name: "",
      channel: "email",
      templateId: "",
      memberStatus: "",
      branchId: "",
      gender: undefined,
      scheduledAt: "",
    },
  });

  React.useEffect(() => {
    form.setValue("templateId", "");
  }, [branchAssignment.value, form]);

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="New Broadcast"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Broadcasts", href: "/communication/broadcasts" },
            { label: "New Broadcast" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">
            You do not have permission to create broadcasts.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: BroadcastFormValues) => {
    const branchPayload = branchAssignment.payload();
    if (!branchPayload) return;
    const audienceFilter: Record<string, string> = {};
    if (values.memberStatus) audienceFilter.status = values.memberStatus;
    if (branchPayload.branchId)
      audienceFilter.branchId = branchPayload.branchId;
    if (values.gender) audienceFilter.gender = values.gender;

    const scheduledAt = values.scheduledAt
      ? new Date(values.scheduledAt).toISOString()
      : undefined;

    try {
      await createMutation.mutateAsync({
        ...branchPayload,
        name: values.name.trim(),
        templateId: values.templateId,
        channel: values.channel,
        audienceFilter:
          Object.keys(audienceFilter).length > 0
            ? (audienceFilter as {
                status?: MemberStatus;
                branchId?: string;
                gender?: "male" | "female";
              })
            : undefined,
        scheduledAt,
      });
      toast.success(
        scheduledAt
          ? "Broadcast scheduled successfully"
          : "Broadcast sent successfully",
      );
      router.push("/communication/broadcasts");
    } catch (err) {
      toast.error("Failed to create broadcast", {
        description: getToastErrorMessage(err, "Please try again."),
      });
    }
  };

  const pending = createMutation.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Broadcast"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Broadcasts", href: "/communication/broadcasts" },
          { label: "New Broadcast" },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.back();
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broadcast Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sunday Service Reminder"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A label you use to identify this broadcast.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setChannel(v as BroadcastChannel);
                        form.setValue("templateId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BROADCAST_CHANNELS.filter((ch) =>
                          profile?.planFeatures?.includes(ch),
                        ).map((ch) => (
                          <SelectItem key={ch} value={ch}>
                            {BROADCAST_CHANNEL_LABELS[ch]}
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
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template *</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              templates.length === 0
                                ? "No published templates for this channel"
                                : "Select template"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.templateId} value={t.templateId}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only published templates for the selected channel are
                      available.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="memberStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Status</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(
                            Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {MEMBER_STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <BranchAssignmentField
                  assignment={branchAssignment}
                  disabled={pending}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave all filters empty to reach every member with a valid
                contact for this channel.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Send At (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to send immediately.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review before sending</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Channel:</strong> {channel}
              </p>
              <p>
                <strong>Audience:</strong>{" "}
                {form.watch("memberStatus") || "All member statuses"};{" "}
                {form.watch("gender") || "all genders"};{" "}
                {branchAssignment.value
                  ? "selected branch"
                  : "your permitted branch scope"}
                .
              </p>
              <p>
                <strong>Timing:</strong>{" "}
                {form.watch("scheduledAt")
                  ? `Scheduled for ${form.watch("scheduledAt")} (local time)`
                  : "Send immediately after confirmation"}
                .
              </p>
              <p>
                Check the selected template and audience above. Delivery uses
                the saved provider settings.
              </p>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirmDiscardChanges()) router.back();
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Megaphone className="mr-2 h-4 w-4" />
              {form.watch("scheduledAt")
                ? "Schedule Broadcast"
                : "Send Broadcast"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
