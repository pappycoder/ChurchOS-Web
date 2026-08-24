"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarCheck,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAttendanceRecords,
  useDeleteAttendance,
  useAttendanceServices,
  SERVICE_CATEGORIES,
  type AttendanceRecord,
} from "@/hooks/use-attendance";
import { usePermissions } from "@/hooks/use-permissions";

export default function AttendanceRecordsPage() {
  const { can } = usePermissions();
  const canDelete = can("attendance", "delete");

  // Filters
  const [serviceId, setServiceId] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  const servicesQuery = useAttendanceServices({ limit: 100 });

  const queryParams = {
    page,
    limit: perPage,
    serviceId: serviceId === "all" ? undefined : serviceId,
    category: category === "all" ? undefined : category,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: "checkinAt" as const,
    sortOrder: "desc" as const,
  };

  const { data, isLoading, error } = useAttendanceRecords(queryParams);
  const deleteMutation = useDeleteAttendance();
  const [deleteTarget, setDeleteTarget] = React.useState<AttendanceRecord | null>(null);

  const records = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const recordName = (record: AttendanceRecord): string =>
    record.memberName ||
    record.visitorName ||
    (record.visitorId ? "Linked visitor" : "Unknown");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.attendanceId);
      toast.success("Record deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete record", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Records"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Attendance", href: "/attendance" },
            { label: "Records" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load attendance records.</p>
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
        title="Records"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Attendance", href: "/attendance" },
          { label: "Records" },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <Select
            value={serviceId}
            onValueChange={(v) => {
              setServiceId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {(servicesQuery.data?.data ?? []).map((s) => (
                <SelectItem key={s.serviceId} value={s.serviceId}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SERVICE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
              aria-label="To date"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<CalendarCheck className="h-12 w-12" />}
                title="No attendance records"
                description={
                  serviceId !== "all" || category !== "all" || startDate || endDate
                    ? "Try adjusting your filters."
                    : "Check-ins will appear here once recorded."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Checked In</TableHead>
                    {canDelete && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.attendanceId}>
                      <TableCell className="font-medium">
                        {recordName(record)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.memberId ? "default" : "outline"}>
                          {record.memberId ? "Member" : "Visitor"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.serviceName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {(
                            SERVICE_CATEGORIES.find(
                              (c) => c.value === (record.category ?? "adult")
                            )?.label ?? "Adult"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {record.source}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(record.checkInAt), "MMM d, yyyy · HH:mm")}
                      </TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(record)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Record
                              </DropdownMenuItem>
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Attendance Record</DialogTitle>
            <DialogDescription className="text-center">
              Remove the check-in for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget ? recordName(deleteTarget) : ""}
              </span>{" "}
              on{" "}
              {deleteTarget
                ? format(new Date(deleteTarget.checkInAt), "MMM d, yyyy")
                : ""}
              ? This cannot be undone.
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
