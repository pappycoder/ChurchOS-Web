"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { format } from "date-fns";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import {
  VisitorHeader as PageHeader,
  visitorWorkspaceClass,
  VisitorSectionHeading,
} from "@/components/visitors/visitor-presentation";
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
import {
  Form,
  FormControl,
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
  useCreateVisitor,
  FOLLOW_UP_STATUSES,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import { useUsers } from "@/hooks/use-users";
import {
  CustomFieldsEditor,
  rowsToCustomFields,
} from "@/components/members/custom-fields-editor";

const newVisitorSchema = z.object({
  branchId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  firstVisitDate: z.string().min(1, "First visit date is required"),
  followUpStatus: z.string(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.array(z.object({ key: z.string(), value: z.string() })),
});

type NewVisitorFormValues = z.infer<typeof newVisitorSchema>;

export default function AddVisitorPage() {
  const router = useRouter();
  const createMutation = useCreateVisitor();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const branchesQuery = useBranchesList({ limit: 200 }, { enabled: isAdminHq });
  const branchOptions = React.useMemo(
    () =>
      (branchesQuery.data?.data ?? []).filter((branch) => !branch.archivedAt),
    [branchesQuery.data],
  );
  // Powers the assignee picker.
  const usersQuery = useUsers({ limit: 100, status: "active" });

  const form = useForm<NewVisitorFormValues>({
    resolver: zodResolver(newVisitorSchema),
    defaultValues: {
      branchId: "",
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      firstVisitDate: format(new Date(), "yyyy-MM-dd"),
      followUpStatus: "new",
      assignedToId: "",
      notes: "",
      customFields: [],
    },
  });

  const customFieldsArray = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  React.useEffect(() => {
    if (!form.getValues("branchId")) {
      const defaultBranch =
        profile?.branchId ??
        (isAdminHq && branchOptions.length === 1
          ? branchOptions[0].branchId
          : "");
      if (defaultBranch) form.setValue("branchId", defaultBranch);
    }
  }, [profile?.branchId, isAdminHq, branchOptions, form]);

  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (values: NewVisitorFormValues) => {
    setSaving(true);
    try {
      const selectedBranch = isAdminHq ? values.branchId : profile?.branchId;
      if (
        !selectedBranch ||
        (isAdminHq &&
          !branchOptions.some((branch) => branch.branchId === selectedBranch))
      ) {
        form.setError("branchId", {
          message: isAdminHq
            ? "Select an available branch."
            : "A branch assignment is required. Contact your church administrator.",
        });
        return;
      }
      const visitor = await createMutation.mutateAsync({
        branchId: selectedBranch,
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || undefined,
        gender: values.gender || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        whatsappNumber: values.whatsappNumber?.trim() || undefined,
        firstVisitDate: values.firstVisitDate,
        followUpStatus: values.followUpStatus as FollowUpStatus,
        assignedToId:
          values.assignedToId && values.assignedToId !== "none"
            ? values.assignedToId
            : undefined,
        notes: values.notes?.trim() || undefined,
        customFields: rowsToCustomFields(values.customFields),
      });
      toast.success(
        `${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""} registered successfully`,
      );
      router.push(`/visitors/${visitor.id}`);
    } catch (error) {
      toast.error("Failed to register visitor", {
        description: getToastErrorMessage(error, "Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${visitorWorkspaceClass} space-y-4`}>
      <PageHeader
        title="Add Visitor"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Visitors", href: "/visitors" },
          { label: "Add" },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.push("/visitors");
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Visitors
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <VisitorSectionHeading>
                  Personal Information
                </VisitorSectionHeading>
              </CardTitle>
              <CardDescription>
                Basic identity and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    {isAdminHq ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={saving || branchesQuery.isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branchOptions.map((branch) => (
                            <SelectItem
                              key={branch.branchId}
                              value={branch.branchId}
                            >
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input
                          value={
                            profile?.branch?.name ??
                            (profile?.branchId
                              ? "Your assigned branch"
                              : "No branch assigned")
                          }
                          readOnly
                        />
                      </FormControl>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isAdminHq
                        ? "Choose the visitor's branch."
                        : "Visitors are limited to your assigned branch."}
                    </p>
                    {isAdminHq && branchesQuery.isError && (
                      <p role="alert" className="text-sm text-destructive">
                        Could not load branches.{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => void branchesQuery.refetch()}
                        >
                          Retry
                        </button>
                      </p>
                    )}
                    {isAdminHq &&
                      branchesQuery.isSuccess &&
                      !branchOptions.length && (
                        <p className="text-sm text-destructive">
                          No active branches available.
                        </p>
                      )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Amina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Okafor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="amina@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 803 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 803 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
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
            </CardContent>
          </Card>

          {/* Visit & follow-up */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <VisitorSectionHeading>
                  Visit &amp; Follow-Up
                </VisitorSectionHeading>
              </CardTitle>
              <CardDescription>
                When they first visited and who owns the relationship.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstVisitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Visit Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="followUpStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FOLLOW_UP_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {(usersQuery.data?.data ?? []).map((user) => (
                          <SelectItem
                            key={user.profileId}
                            value={user.profileId}
                          >
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Custom fields */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <VisitorSectionHeading>Custom Fields</VisitorSectionHeading>
              </CardTitle>
              <CardDescription>
                Track anything specific to your church — how they heard about
                you, prayer requests, referral source.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomFieldsEditor
                rows={customFieldsArray.fields}
                onChange={(rows) =>
                  form.setValue("customFields", rows, { shouldDirty: true })
                }
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <VisitorSectionHeading>Notes</VisitorSectionHeading>
              </CardTitle>
              <CardDescription>
                Admin-only context about this visitor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Invited by Mrs. Ade — interested in the youth ministry"
                        rows={3}
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
              onClick={() => {
                if (confirmDiscardChanges()) router.push("/visitors");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering Visitor...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Visitor
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
