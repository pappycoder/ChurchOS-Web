"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/hooks/use-attendance";
import {
  useMembersList,
  useSearchMembers,
  type Member,
} from "@/hooks/use-members";
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
  const canCreate = can("attendance", "create");

  // Selected service + category override.
  const servicesQuery = useAttendanceServices({ isActive: true, limit: 100 });
  const services = servicesQuery.data?.data ?? [];
  const [serviceId, setServiceId] = React.useState("");
  const [category, setCategory] = React.useState<ServiceCategory | "">("");

  const selectedService = services.find((s) => s.serviceId === serviceId);
  const effectiveCategory: ServiceCategory =
    (category || selectedService?.category || "adult") as ServiceCategory;

  // Mode switch.
  const [mode, setMode] = React.useState<"members" | "visitor">("members");

  // ─── Roster mode ────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const rosterQuery = useMembersList({
    page: 1,
    limit: 50,
    status: "active",
  });
  const searchQuery = useSearchMembers(search, 50);

  const searching = search.trim().length >= 2;
  const members: Member[] = searching
    ? (searchQuery.data?.data ?? [])
    : (rosterQuery.data?.data ?? []);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const bulkMutation = useRecordBulkAttendance();

  const toggleMember = (memberId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  const handleBulkSubmit = async () => {
    if (!serviceId || selectedIds.size === 0) return;
    try {
      const result = await bulkMutation.mutateAsync({
        serviceId,
        records: Array.from(selectedIds).map((memberId) => ({ memberId })),
        category: effectiveCategory,
        source: "manual",
      });
      toast.success(`${result.recorded} checked in`, {
        description:
          result.skipped > 0
            ? `${result.skipped} skipped — already checked in for this service.`
            : undefined,
      });
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Bulk check-in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

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
        toast.success(
          `${visitor.firstName}${visitor.lastName ? ` ${visitor.lastName}` : ""} checked in`,
          {
            description: "Visitor registered and attendance recorded.",
          }
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
        description: error instanceof Error ? error.message : "Please try again.",
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
            <Select value={serviceId} onValueChange={setServiceId}>
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
              onValueChange={(v) => setCategory(v as ServiceCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
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

      {/* Mode tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === "members" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("members")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Members (Roster)
        </Button>
        <Button
          variant={mode === "visitor" ? "default" : "outline"}
          size="sm"
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
        /* ─── Roster bulk check-in ─── */
        <Card>
          <CardHeader className="pb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Roster</CardTitle>
              <CardDescription>
                Tick everyone present, then submit once. Duplicates are skipped
                automatically.
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search members..."
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selection bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2.5">
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleBulkSubmit} disabled={bulkMutation.isPending}>
                    {bulkMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        Check In {selectedIds.size}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {rosterQuery.isLoading || (searching && searchQuery.isLoading) ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No members match your search.
              </p>
            ) : (
              <div className="rounded-md border divide-y max-h-[52vh] overflow-y-auto">
                {members.map((member) => {
                  const checked = selectedIds.has(member.memberId);
                  return (
                    <label
                      key={member.memberId}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 ${
                        checked ? "bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) =>
                          toggleMember(member.memberId, !!c)
                        }
                        aria-label={`Select ${member.firstName} ${member.lastName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.phone && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.phone}
                          </p>
                        )}
                      </div>
                      {checked && <Badge variant="secondary">Selected</Badge>}
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
                  <Link href="/visitors" className="underline hover:text-foreground">
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
