"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  AttendanceWorkspace,
  AttendanceHeader,
  AttendanceMoreFilters,
  AttendanceRecordActions,
  AttendanceFormSection,
  AttendanceCategoryBadge,
  AttendanceStatusBadge,
  attendanceWorkspaceClass,
} from "@/components/attendance/attendance-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAttendanceServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useArchiveService,
  useRestoreArchiveService,
  SERVICE_CATEGORIES,
  type ChurchService,
  type ServiceCategory,
} from "@/hooks/use-attendance";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import { BranchFilter } from "@/components/shared/branch-filter";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function dayLabel(day?: number): string {
  return DAY_OPTIONS.find((d) => d.value === String(day))?.label ?? "-";
}

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  branchId: z.string().optional(),
  category: z.string(),
  dayOfWeek: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function toFormValues(service?: ChurchService | null): ServiceFormValues {
  return {
    name: service?.name ?? "",
    branchId: service?.branchId ?? "",
    category: service?.category ?? "adult",
    dayOfWeek:
      service?.dayOfWeek !== undefined && service?.dayOfWeek !== null
        ? String(service.dayOfWeek)
        : "",
    // Recurring schedules use local HH:mm clock values.
    startTime: service?.startTime ?? "",
    endTime: service?.endTime ?? "",
    isActive: service?.isActive ?? true,
  };
}

export default function AttendanceServicesPage() {
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const canCreate = canAny("attendance:services:create");
  const canUpdate = can("attendance:services", "update");
  const canDelete = can("attendance:services", "delete");
  const canManage = canCreate || canUpdate || canDelete;

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [branchId, setBranchId] = React.useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ChurchService | null>(null);
  const branchesQuery = useBranchesList(
    { limit: 200 },
    { enabled: dialogOpen && isAdminHq },
  );
  const branchOptions = React.useMemo(
    () =>
      (branchesQuery.data?.data ?? []).filter((branch) => !branch.archivedAt),
    [branchesQuery.data],
  );
  const [deleteTarget, setDeleteTarget] = React.useState<ChurchService | null>(
    null,
  );
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    service: ChurchService;
  } | null>(null);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      archived: archivedView ? true : undefined,
      branchId: branchId || undefined,
    }),
    [page, perPage, archivedView, branchId],
  );

  const { data, isLoading, error } = useAttendanceServices(queryParams);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(editing?.serviceId ?? "");
  const deleteMutation = useDeleteService();
  const archiveMutation = useArchiveService();
  const restoreArchiveMutation = useRestoreArchiveService();

  const services = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: toFormValues(null),
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset({
        ...toFormValues(editing),
        branchId: editing
          ? (editing.branchId ?? "")
          : (profile?.branchId ?? ""),
      });
    }
  }, [dialogOpen, editing, form, profile?.branchId]);

  React.useEffect(() => {
    if (
      dialogOpen &&
      !editing &&
      isAdminHq &&
      branchOptions.length === 1 &&
      !form.getValues("branchId")
    ) {
      form.setValue("branchId", branchOptions[0].branchId);
    }
  }, [dialogOpen, editing, isAdminHq, branchOptions, form]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (service: ChurchService) => {
    setEditing(service);
    setDialogOpen(true);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      const selectedBranch = isAdminHq ? values.branchId : profile?.branchId;
      const branchChanged =
        !!editing && values.branchId !== (editing.branchId ?? "");
      if (
        (!editing || branchChanged) &&
        (!selectedBranch ||
          (isAdminHq &&
            !branchOptions.some(
              (branch) => branch.branchId === selectedBranch,
            )))
      ) {
        form.setError("branchId", {
          message: isAdminHq
            ? "Select an available branch."
            : "A branch assignment is required. Contact your church administrator.",
        });
        return;
      }
      if (editing) {
        // Explicit nulls so cleared Day/Time fields persist as "no value".
        await updateMutation.mutateAsync({
          name: values.name.trim(),
          ...(isAdminHq && branchChanged ? { branchId: selectedBranch } : {}),
          category: values.category as ServiceCategory,
          dayOfWeek:
            values.dayOfWeek && values.dayOfWeek !== "none"
              ? Number(values.dayOfWeek)
              : null,
          startTime: values.startTime || null,
          endTime: values.endTime || null,
          isActive: values.isActive,
        });
        toast.success("Service updated");
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          branchId: selectedBranch,
          category: values.category as ServiceCategory,
          dayOfWeek:
            values.dayOfWeek && values.dayOfWeek !== "none"
              ? Number(values.dayOfWeek)
              : undefined,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          isActive: values.isActive,
        });
        toast.success("Service created");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(
        editing ? "Failed to update service" : "Failed to create service",
        {
          description: getToastErrorMessage(error, "Please try again."),
        },
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.serviceId);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(`Failed to delete ${deleteTarget.name}`, {
        description: getToastErrorMessage(error, "Please try again."),
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <AttendanceHeader
          title="Services"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Attendance", href: "/attendance" },
            { label: "Services" },
          ]}
        />
        <ErrorState title="Failed to load services." />
      </div>
    );
  }

  return (
    <AttendanceWorkspace>
      <AttendanceHeader
        count={meta?.total}
        title="Services"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance", href: "/attendance" },
          { label: "Services" },
        ]}
        action={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )
        }
      />

      <TableCard
        title="Church Services"
        itemName="services"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
            />
            <AttendanceMoreFilters count={Number(archivedView)}>
              <ArchivedFilter
                value={archivedFilter}
                onChange={(value) => {
                  setArchivedFilter(value);
                  setPage(1);
                }}
              />
            </AttendanceMoreFilters>
          </div>
        }
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<CalendarDays className="h-12 w-12" />}
              title={archivedView ? "No archived services" : "No services yet"}
              description={
                archivedView
                  ? "Archive a service to move it here."
                  : canCreate
                    ? "Create your weekly services so check-ins can be recorded against them."
                    : "No services have been configured."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.serviceId}
                    className="cursor-pointer"
                    onClick={() => {
                      if (confirmDiscardChanges())
                        router.push(
                          `/attendance/services/${service.serviceId}`,
                        );
                    }}
                  >
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dayLabel(service.dayOfWeek)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {service.startTime && service.endTime
                          ? `${service.startTime}–${service.endTime}`
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AttendanceCategoryBadge
                        category={service.category ?? "adult"}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(service.attendanceCount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadge
                        status={service.isActive ? "active" : "inactive"}
                      />
                    </TableCell>
                    {canManage && !archivedView && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => openEdit(service)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canUpdate && !service.archivedAt && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchiveTarget({ kind: "archive", service })
                                }
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem
                                disabled={updateMutation.isPending}
                                onClick={() =>
                                  updateMutation.mutate(
                                    { isActive: !service.isActive },
                                    {
                                      onSuccess: () =>
                                        toast.success(
                                          service.isActive
                                            ? "Service deactivated"
                                            : "Service activated",
                                        ),
                                      onError: (err) =>
                                        toast.error(
                                          "Failed to update service",
                                          {
                                            description:
                                              err?.message ||
                                              "Please try again.",
                                          },
                                        ),
                                    },
                                  )
                                }
                              >
                                {service.isActive ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(service)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                    {canManage && archivedView && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AttendanceRecordActions>
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setArchiveTarget({ kind: "restore", service })
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setArchiveTarget({ kind: "purge", service })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Forever
                            </Button>
                          )}
                        </AttendanceRecordActions>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCard>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`${attendanceWorkspaceClass} sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl`}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Service" : "Add Service"}
            </DialogTitle>
            <DialogDescription>
              Check-ins default to the service&apos;s category when recorded.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <AttendanceFormSection title="Service details">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Sunday First Service"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          disabled={
                            branchesQuery.isLoading ||
                            createMutation.isPending ||
                            updateMutation.isPending
                          }
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
                            aria-readonly="true"
                          />
                        </FormControl>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isAdminHq
                          ? "Choose the branch where this service takes place."
                          : "Services are limited to your assigned branch."}
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
              </AttendanceFormSection>
              <AttendanceFormSection title="Schedule & defaults">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
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
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Any day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Any day</SelectItem>
                            {DAY_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Inactive services are hidden from new check-ins.
                          </p>
                        </div>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AttendanceFormSection>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Service"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className={`${attendanceWorkspaceClass} sm:max-w-[420px] rounded-2xl`}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Service</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? Deletion is blocked while attendance records still reference it.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="service"
        targetName={archiveTarget?.service.name}
        targetId={archiveTarget?.service.serviceId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </AttendanceWorkspace>
  );
}
