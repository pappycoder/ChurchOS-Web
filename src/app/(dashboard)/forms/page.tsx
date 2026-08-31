"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Copy,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  FilePlus2,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useFormsList,
  useDeleteForm,
  useArchiveForm,
  useRestoreForm,
  useCloneForm,
  useCloseForm,
  useReopenForm,
  type Form,
  type FormStatus,
  FORM_STATUS_LABELS,
  FORM_STATUS_TEXT,
} from "@/hooks/use-forms";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { ArchivedFilter, type ArchivedFilterValue } from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_OPTIONS: Array<{ value: FormStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

export default function FormsPage() {
  const { can } = usePermissions();
  const canCreate = can("forms", "create");
  const canUpdate = can("forms", "update");
  const canDelete = can("forms", "delete");
  const canManage = canCreate || canUpdate || canDelete;
  const router = useRouter();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FormStatus | "all">("all");
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const [deleteTarget, setDeleteTarget] = React.useState<Form | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    form: Form;
  } | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, search, statusFilter, archivedView]
  );

  const { data, isLoading, error } = useFormsList(queryParams);

  const forms = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const deleteMutation = useDeleteForm();
  const archiveMutation = useArchiveForm();
  const restoreMutation = useRestoreForm();
  const cloneMutation = useCloneForm();
  const closeMutation = useCloseForm();
  const reopenMutation = useReopenForm();

  const handleShare = async (form: Form) => {
    if (!form.publicToken) return;
    const url = `${window.location.origin}/forms/public/${form.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const handleClone = async (form: Form) => {
    try {
      await cloneMutation.mutateAsync(form.id);
      toast.success("Form cloned");
    } catch (err) {
      toast.error("Failed to clone form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleClose = async (form: Form) => {
    try {
      await closeMutation.mutateAsync(form.id);
      toast.success("Form closed to new submissions");
    } catch (err) {
      toast.error("Failed to close form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleReopen = async (form: Form) => {
    try {
      await reopenMutation.mutateAsync(form.id);
      toast.success("Form reopened");
    } catch (err) {
      toast.error("Failed to reopen form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Form deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDeletePending(false);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Forms"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Forms" }]}
        />
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">Failed to load forms</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Forms"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Forms" }]}
        action={
          canCreate ? (
            <Button onClick={() => router.push("/forms/new")}>
              <Plus className="mr-1 h-4 w-4" />
              Add Form
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Total Forms"
          value={meta?.total ?? 0}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatsCard
          title="Published"
          value={forms.filter((f) => f.status === "published" && !f.archivedAt).length}
          variant="success"
        />
        <StatsCard
          title="Public"
          value={forms.filter((f) => f.isPublic && !f.archivedAt).length}
          variant="primary"
        />
      </div>

      <TableCard
        title="All Forms"
        description={archivedView ? "Archived forms" : undefined}
        itemName="forms"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(p) => {
          setPerPage(p);
          setPage(1);
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <ArchivedFilter
              value={archivedFilter}
              onChange={(v) => {
                setArchivedFilter(v);
                setPage(1);
              }}
            />
            <SearchInput
              placeholder="Search forms..."
              value={searchInput}
              onChange={setSearchInput}
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as FormStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Public</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-8" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : forms.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title={archivedView ? "No archived forms" : "No forms yet"}
              description={
                archivedView
                  ? "Archived forms will appear here."
                  : search || statusFilter !== "all"
                    ? "No forms match your filters."
                    : "Create your first form to start collecting responses."
              }
              action={
                canCreate && !archivedView && !search && statusFilter === "all"
                  ? { label: "Add Form", href: "/forms/new" }
                  : undefined
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Public</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow
                  key={form.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/forms/${form.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{form.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {form.description ? (
                        <span className="line-clamp-1 max-w-[240px]">{form.description}</span>
                      ) : (
                        `Updated ${format(new Date(form.updatedAt), "MMM d, yyyy")}`
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={FORM_STATUS_TEXT[form.status]}>
                      {FORM_STATUS_LABELS[form.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{form.fields.length}</TableCell>
                  <TableCell>{form.submissionCount}</TableCell>
                  <TableCell>
                    {form.isPublic ? (
                      <Badge variant="secondary">Public</Badge>
                    ) : (
                      <span className="text-muted-foreground">Private</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {archivedView ? (
                        <div className="flex justify-end gap-2">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveTarget({ kind: "restore", form });
                              }}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Restore
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(form);
                              }}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete Forever
                            </Button>
                          )}
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Form actions"
                              title="Form actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/forms/${form.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {form.isPublic && form.publicToken && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(form);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Share Link
                              </DropdownMenuItem>
                            )}
                            {canCreate && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClone(form);
                                }}
                              >
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                Clone
                              </DropdownMenuItem>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/forms/${form.id}/edit`);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canUpdate &&
                              (form.status === "draft" || form.status === "published") && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose(form);
                                  }}
                                >
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                  Close
                                </DropdownMenuItem>
                              )}
                            {canUpdate && form.status === "closed" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopen(form);
                                }}
                              >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Reopen
                              </DropdownMenuItem>
                            )}
                            {canDelete && !form.archivedAt && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveTarget({ kind: "archive", form });
                                  }}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(form);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      {deleteTarget && (
        <Dialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Delete form?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This permanently deletes &quot;{deleteTarget.title}&quot; and all of its
              submissions. This cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deletePending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deletePending}>
                {deletePending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {archiveTarget && (
        <ArchiveConfirmDialog
          open={!!archiveTarget}
          onOpenChange={(o) => !o && setArchiveTarget(null)}
          kind={archiveTarget.kind}
          entityLabel="form"
          targetName={archiveTarget.form.title}
          targetId={archiveTarget.form.id}
          mutation={archiveTarget.kind === "archive" ? archiveMutation : restoreMutation}
          onConfirmed={() => setArchiveTarget(null)}
        />
      )}
    </div>
  );
}
