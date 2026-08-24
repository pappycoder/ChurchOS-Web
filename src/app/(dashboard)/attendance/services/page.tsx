"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SERVICE_CATEGORIES,
  type ChurchService,
  type ServiceCategory,
} from "@/hooks/use-attendance";
import { usePermissions } from "@/hooks/use-permissions";

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
    category: service?.category ?? "adult",
    dayOfWeek:
      service?.dayOfWeek !== undefined && service?.dayOfWeek !== null
        ? String(service.dayOfWeek)
        : "",
    // datetime-local values are "HH:mm" strings on the wire
    startTime: service?.startTime
      ? format(parseISO(service.startTime), "HH:mm")
      : "",
    endTime: service?.endTime ? format(parseISO(service.endTime), "HH:mm") : "",
    isActive: service?.isActive ?? true,
  };
}

export default function AttendanceServicesPage() {
  const { can } = usePermissions();
  const canCreate = can("attendance", "create");
  const canUpdate = can("attendance", "update");
  const canDelete = can("attendance", "delete");
  const canManage = canCreate || canUpdate || canDelete;

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ChurchService | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ChurchService | null>(null);

  const { data, isLoading, error } = useAttendanceServices({ page, limit: perPage });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(editing?.serviceId ?? "");
  const deleteMutation = useDeleteService();

  const services = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: toFormValues(null),
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(toFormValues(editing));
    }
  }, [dialogOpen, editing, form]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (service: ChurchService) => {
    setEditing(service);
    setDialogOpen(true);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    const payload = {
      name: values.name.trim(),
      category: values.category as ServiceCategory,
      dayOfWeek:
        values.dayOfWeek && values.dayOfWeek !== "none"
          ? Number(values.dayOfWeek)
          : undefined,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
      isActive: values.isActive,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync(payload);
        toast.success("Service updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Service created");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(editing ? "Failed to update service" : "Failed to create service", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
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
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Services"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Attendance", href: "/attendance" },
            { label: "Services" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load services.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
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

      <Card>
        <CardContent className="p-0">
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
                title="No services yet"
                description={
                  canCreate
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
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.serviceId}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dayLabel(service.dayOfWeek)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {service.startTime && service.endTime
                            ? `${format(parseISO(service.startTime), "HH:mm")}–${format(parseISO(service.endTime), "HH:mm")}`
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(SERVICE_CATEGORIES.find(
                            (c) => c.value === (service.category ?? "adult")
                          )?.label) ?? "Adult"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          <span
                            className={`mr-1 h-1.5 w-1.5 rounded-full ${
                              service.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => openEdit(service)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
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
                                              : "Service activated"
                                          ),
                                        onError: (err) =>
                                          toast.error("Failed to update service", {
                                            description:
                                              err?.message || "Please try again.",
                                          }),
                                      }
                                    )
                                  }
                                >
                                  {service.isActive ? "Deactivate" : "Activate"}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        itemName="services"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              Check-ins default to the service&apos;s category when recorded.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sunday First Service" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
              <div className="grid grid-cols-2 gap-4">
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
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Service</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              Deletion is blocked while attendance records still reference it. This
              action cannot be undone.
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
    </div>
  );
}
