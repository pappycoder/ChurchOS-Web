"use client";

import { GeneralAttendancePanel } from "@/components/attendance/general-attendance-panel";

import { ChurchAttendanceRoster } from "@/components/attendance/church-attendance-roster";

import * as React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useAttendanceServices,
  useRecordBulkAttendance,
  useRecordAttendance,
  ATTENDANCE_CATEGORIES,
  type AttendanceCategory,
} from "@/hooks/use-attendance";
import { useCreateVisitor } from "@/hooks/use-visitors";
import { usePermissions } from "@/hooks/use-permissions";
import {
  CustomFieldsEditor,
  rowsToCustomFields,
} from "@/components/members/custom-fields-editor";

const visitorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  customFields: z.array(z.object({ key: z.string(), value: z.string() })),
});

type VisitorFormValues = z.infer<typeof visitorSchema>;

export default function CheckInPage() {
  const router = useRouter();
  const { can } = usePermissions();
  // Route gate already requires attendance:create; keep button-level checks consistent.
  const [checkingIn, setCheckingIn] = React.useState(false);
  const [attendanceDate, setAttendanceDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const canCreate = can("attendance:checkin", "create");

  // Selected service + category override.
  const servicesQuery = useAttendanceServices({ isActive: true, limit: 100 });
  const services = servicesQuery.data?.data ?? [];
  const [serviceId, setServiceId] = React.useState("");
  const [category, setCategory] = React.useState<AttendanceCategory | "">("");

  const selectedService = services.find((s) => s.serviceId === serviceId);
  const effectiveCategory: AttendanceCategory =
    category || (selectedService?.category === "mixed" ? "unspecified" : selectedService?.category || "adult");

  // Mode switch.
  const [mode, setMode] = React.useState<"members" | "visitor">("members");

  const bulkMutation = useRecordBulkAttendance();

  // ─── Visitor mode ───────────────────────────────────────
  const createVisitorMutation = useCreateVisitor();
  const recordMutation = useRecordAttendance();
  const [visitorPending, setVisitorPending] = React.useState(false);
  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      phone: "",
      email: "",
      customFields: [],
    },
  });
  const customFieldsArray = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  const handleVisitorSubmit = async (values: VisitorFormValues) => {
    if (!serviceId) return;
    setVisitorPending(true);
    try {
      // 1) Register the visitor.
      const visitor = await createVisitorMutation.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || undefined,
        gender: values.gender || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        customFields: rowsToCustomFields(values.customFields),
      });

      // 2) Auto-record their check-in. Failure must not lose the visitor.
      try {
        await recordMutation.mutateAsync({
        serviceId,
          visitorId: visitor.id,
        category: effectiveCategory,
        source: "manual",
      });
      toast.success(`${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""} checked in`,
          {
            description: "Visitor registered and attendance recorded.",
          },
        );
      } catch {
        toast.warning("Visitor registered, but the check-in failed.", {
          description: `Record it manually from the Records page for ${visitor.firstName}.`,
        });
      }

      form.reset({
        firstName: "",
        lastName: "",
        gender: "",
        phone: "",
        email: "",
        customFields: [],
      });
      router.push(`/visitors/${visitor.id}`);
    } catch (error) {
      toast.error("Failed to register visitor", {
        description: getToastErrorMessage(error, "Please try again."),
      });
    } finally {
      setVisitorPending(false);
    }
  };

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="Check-In"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Attendance", href: "/attendance" },
            { label: "Check-In" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            You do not have permission to record attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Check-In"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance", href: "/attendance" },
          { label: "Check-In" },
        ]}
      />

      {/* Service picker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Service</CardTitle>
          <CardDescription>
            Pick today&apos;s service — its category pre-fills the check-ins.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Service *</p>
            <Select disabled={checkingIn} value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.serviceId} value={s.serviceId}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {servicesQuery.isLoading && <Skeleton className="h-9 w-full" />}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Category</p>
            <Select
              value={effectiveCategory}
              onValueChange={(v) => setCategory(v as AttendanceCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Defaults from {selectedService?.name ?? "the service"}.
            </p>
          </div>
        </CardContent>
      </Card>

      <GeneralAttendancePanel service={selectedService} requireService />

      {/* Mode tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === "members" ? "default" : "outline"}
          size="sm"
          disabled={checkingIn}
          onClick={() => setMode("members")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Members (Roster)
        </Button>
        <Button
          variant={mode === "visitor" ? "default" : "outline"}
          size="sm"
          disabled={checkingIn}
          onClick={() => setMode("visitor")}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Visitor
        </Button>
      </div>

      {!serviceId ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a service above to start checking people in.
            </p>
          </CardContent>
        </Card>
      ) : mode === "members" ? (
        <ChurchAttendanceRoster
          onBusyChange={setCheckingIn}
          key={`${serviceId}:${attendanceDate}`}
          disabled={!attendanceDate}
          controls={
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Attendance Date</span>
              <Input
                type="date"
                aria-label="Attendance Date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                disabled={checkingIn}
                required
                className="w-full sm:w-52"
              />
              <span className="block text-xs text-muted-foreground">Attendance will be recorded for this date.</span>
            </label>
          }
          branchId={selectedService?.branchId}
          onSubmit={async (ids) => {
            const result = await bulkMutation.mutateAsync({
              attendanceDate,
              serviceId,
              records: ids.map((memberId) => ({ memberId })),
              category: effectiveCategory,
              source: "manual",
            });
            return { recorded: result.recorded, skipped: result.skipped };
          }}
        />
      ) : (
        /* ─── Visitor registration + auto check-in ─── */
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">New Visitor</CardTitle>
            <CardDescription>
              Registers the visitor and records their check-in in one go.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleVisitorSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Custom Fields</p>
                  <CustomFieldsEditor
                    rows={customFieldsArray.fields}
                    onChange={(rows) =>
                      form.setValue("customFields", rows, { shouldDirty: true })
                    }
                    disabled={visitorPending}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      form.reset({
                        firstName: "",
                        lastName: "",
                        gender: "",
                        phone: "",
                        email: "",
                        customFields: [],
                      })
                    }
                    disabled={visitorPending}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={visitorPending}>
                    {visitorPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering &amp; Checking In...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register &amp; Check In
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  They will also appear on{" "}
                  <Link
                    href="/visitors"
                    className="underline hover:text-foreground"
                  >
                    the visitors list
                  </Link>{" "}
                  for follow-up.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
