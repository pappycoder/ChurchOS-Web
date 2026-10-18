"use client";

import * as React from "react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  useGeneralAttendance,
  useSaveGeneralAttendance,
  fetchGeneralAttendance,
  attendanceSessionPermissions,
  type AttendanceSessionContext,
  type ChurchService,
  type GeneralAttendanceCounts,
  type GeneralAttendanceRecord,
  type GeneralAttendanceParams,
} from "@/hooks/use-attendance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BranchFilter } from "@/components/shared/branch-filter";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { toast, getToastErrorMessage } from "@/lib/toast";
import { fetchAllPages } from "@/lib/export-all";

const countFields = [
  ["total", "Total attendance"],
  ["adultCount", "Adults"],
  ["childrenCount", "Children"],
  ["maleCount", "Male"],
  ["femaleCount", "Female"],
] as const;
const columns = [
  { key: "attendanceDate", label: "Date" },
  { key: "contextName", label: "Meeting" },
  { key: "branchName", label: "Branch" },
  ...countFields.map(([key, label]) => ({ key, label })),
];
const emptyCounts = {
  total: "",
  adultCount: "",
  childrenCount: "",
  maleCount: "",
  femaleCount: "",
};

export function GeneralAttendancePanel({
  service,
  context,
  canManage = true,
  requireService = false,
  readOnly = false,
  filters = {},
}: {
  service?: ChurchService;
  context?: AttendanceSessionContext;
  canManage?: boolean;
  requireService?: boolean;
  readOnly?: boolean;
  filters?: GeneralAttendanceParams;
}) {
  const { canAny } = usePermissions();
  const target =
    context ??
    (service
      ? {
          type: "service" as const,
          id: service.serviceId,
          name: service.name,
          branchId: service.branchId,
          active: service.isActive && !service.archivedAt,
        }
      : undefined);
  const grants = attendanceSessionPermissions(
    target?.type ?? filters.contextType,
  );
  const { data: profile } = useCurrentProfile();
  const canRead = canAny(grants.read);
  const canCreate =
    !readOnly &&
    canManage &&
    canAny(grants.create) &&
    !!target &&
    target.active !== false;
  const canUpdate =
    !readOnly && canManage && canAny(grants.update) && target?.active !== false;
  const [page, setPage] = React.useState(1);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const params = {
    ...filters,
    contextType: target?.type ?? filters.contextType,
    contextId: target?.id ?? filters.contextId,
    serviceId: target?.type === "service" ? target.id : filters.serviceId,
    startDate: filters.startDate || startDate || undefined,
    endDate: filters.endDate || endDate || undefined,
    branchId: filters.branchId || branchId || undefined,
    page,
    limit: 20,
  };
  const query = useGeneralAttendance(params, !requireService || !!target);
  const save = useSaveGeneralAttendance();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GeneralAttendanceRecord | null>(
    null,
  );
  const [date, setDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [recordBranch, setRecordBranch] = React.useState("");
  const [values, setValues] = React.useState(emptyCounts);
  const [error, setError] = React.useState("");
  React.useEffect(
    () => setPage(1),
    [target?.id, filters.branchId, filters.startDate, filters.endDate],
  );
  function begin(record?: GeneralAttendanceRecord) {
    setEditing(record ?? null);
    setDate(record?.attendanceDate ?? format(new Date(), "yyyy-MM-dd"));
    setRecordBranch(
      record?.branchId ?? target?.branchId ?? profile?.branchId ?? "",
    );
    setValues(
      record
        ? (Object.fromEntries(
            countFields.map(([key]) => [
              key,
              record[key] == null ? "" : String(record[key]),
            ]),
          ) as typeof emptyCounts)
        : { ...emptyCounts },
    );
    setError("");
    setOpen(true);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const counts = Object.fromEntries(
      countFields.map(([key]) => [
        key,
        values[key] === "" ? null : Number(values[key]),
      ]),
    ) as unknown as GeneralAttendanceCounts;
    if (
      values.total === "" ||
      countFields.some(
        ([key]) =>
          values[key] !== "" &&
          (!Number.isInteger(Number(values[key])) ||
            Number(values[key]) < 0 ||
            Number(values[key]) > 2147483647),
      )
    ) {
      setError(
        "Enter a total and non-negative whole numbers for any breakdowns.",
      );
      return;
    }
    if (
      (counts.adultCount ?? 0) + (counts.childrenCount ?? 0) > counts.total ||
      (counts.maleCount ?? 0) + (counts.femaleCount ?? 0) > counts.total
    ) {
      setError(
        "The adult/children and male/female subtotals must each be no greater than the total.",
      );
      return;
    }
    if (!recordBranch) {
      setError("Select the branch for this meeting attendance.");
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        counts,
        contextType: target?.type ?? editing?.contextType,
        contextId: target?.id ?? editing?.contextId,
        ...(target?.type === "service" || (!target && editing?.serviceId)
          ? { serviceId: target?.id ?? editing?.serviceId }
          : {}),
        branchId: recordBranch,
        attendanceDate: date,
      });
      toast.success(
        editing ? "General attendance updated" : "General attendance recorded",
      );
      setOpen(false);
    } catch (err) {
      setError(getToastErrorMessage(err, "Could not save general attendance."));
    }
  }
  if ((!canRead && !canCreate) || (requireService && !target)) return null;
  const rows = (query.data?.data ?? []).map((row) => ({
    ...row,
    contextName: row.contextName ?? row.serviceName,
  }));
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>General Attendance</CardTitle>
          <div className="flex gap-2">
            {canRead && (
              <ExportDropdown
                columns={columns}
                data={rows.map((row) => ({ ...row }))}
                title="General Attendance"
                filename="general-attendance"
                disabled={!rows.length}
                fetchAllRows={async () => {
                  const all = await fetchAllPages<GeneralAttendanceRecord>(
                    (page) =>
                      fetchGeneralAttendance({ ...params, page, limit: 200 }),
                  );
                  return all.map((row) => ({
                    ...row,
                    contextName: row.contextName ?? row.serviceName,
                  }));
                }}
              />
            )}
            {canCreate && (
              <Button onClick={() => begin()}>Record general attendance</Button>
            )}
          </div>
        </div>
        <CardDescription>
          Meeting totals with optional breakdowns. Named attendees are optional
          details. These are reported separately from individual check-ins. A
          dash means a breakdown was not supplied.
        </CardDescription>
      </CardHeader>
      {canRead && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor={`general-start-${target?.id ?? "all"}`}>
                From
              </Label>
              <Input
                id={`general-start-${target?.id ?? "all"}`}
                type="date"
                value={params.startDate ?? ""}
                disabled={!!filters.startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor={`general-end-${target?.id ?? "all"}`}>To</Label>
              <Input
                id={`general-end-${target?.id ?? "all"}`}
                type="date"
                value={params.endDate ?? ""}
                disabled={!!filters.endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {!filters.branchId && (
              <div className="self-end">
                <BranchFilter
                  value={branchId}
                  onChange={(v) => {
                    setBranchId(v);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>
          {query.isError ? (
            <div role="alert">
              Could not load general attendance.{" "}
              <Button variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : query.isLoading ? (
            <p>Loading general attendance…</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  aria-label="General attendance"
                  className="w-full text-sm"
                >
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th className="p-2 text-left" key={c.key}>
                          {c.label}
                        </th>
                      ))}
                      {canUpdate && <th className="p-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t">
                        {columns.map((c) => (
                          <td className="p-2" key={c.key}>
                            {String(
                              row[c.key as keyof GeneralAttendanceRecord] ??
                                "—",
                            )}
                          </td>
                        ))}
                        {canUpdate && (
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => begin(row)}
                            >
                              Edit headcount
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td
                          className="p-4"
                          colSpan={columns.length + (canUpdate ? 1 : 0)}
                        >
                          No general attendance recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span>
                  {query.data?.meta.total ?? 0} records · Page {page}
                </span>
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= (query.data?.meta.totalPages ?? 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Edit general attendance"
                : "Record general attendance"}
            </DialogTitle>
            <DialogDescription>
              {editing?.contextName ?? editing?.serviceName ?? target?.name}.
              Only total attendance is required; all breakdowns are optional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="general-date">Attendance date</Label>
              <Input
                id="general-date"
                type="date"
                required
                value={date}
                disabled={!!editing}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {!editing && !target?.branchId && profile?.isAdminHq && (
              <div>
                <Label>Branch</Label>
                <BranchFilter
                  value={recordBranch}
                  onChange={setRecordBranch}
                  allLabel="Select a branch"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {countFields.map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`general-${key}`}>
                    {label}
                    {key === "total" ? " *" : " (optional)"}
                  </Label>
                  <Input
                    id={`general-${key}`}
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    required={key === "total"}
                    value={values[key]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save attendance"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
