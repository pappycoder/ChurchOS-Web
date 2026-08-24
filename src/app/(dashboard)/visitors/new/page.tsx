"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
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
import { useCreateVisitor, FOLLOW_UP_STATUSES, type FollowUpStatus } from "@/hooks/use-visitors";
import { useUsers } from "@/hooks/use-users";
import {
  CustomFieldsEditor,
  rowsToCustomFields,
} from "@/components/members/custom-fields-editor";

const newVisitorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
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
  // Powers the assignee picker.
  const usersQuery = useUsers({ limit: 100, status: "active" });

  const form = useForm<NewVisitorFormValues>({
    resolver: zodResolver(newVisitorSchema),
    defaultValues: {
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

  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (values: NewVisitorFormValues) => {
    setSaving(true);
    try {
      const visitor = await createMutation.mutateAsync({
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
      toast.success(`${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""} registered successfully`);
      router.push(`/visitors/${visitor.id}`);
    } catch (error) {
      toast.error("Failed to register visitor", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add Visitor"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Visitors", href: "/visitors" },
          { label: "Add" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/visitors")}>
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
              <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
              <CardDescription>Basic identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
              <CardTitle className="text-sm font-semibold">Visit &amp; Follow-Up</CardTitle>
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
                          <SelectItem key={user.profileId} value={user.profileId}>
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
              <CardTitle className="text-sm font-semibold">Custom Fields</CardTitle>
              <CardDescription>
                Track anything specific to your church — how they heard about you,
                prayer requests, referral source.
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
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
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
              onClick={() => router.push("/visitors")}
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
