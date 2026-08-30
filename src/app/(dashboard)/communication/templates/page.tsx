"use client";

import * as React from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { TableCard } from "@/components/shared/table-card";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ExportDropdown } from "@/components/shared/export-dropdown";
import {
  useTemplatesList,
  usePublishTemplate,
  useArchiveTemplate,
  useRestoreTemplate,
  useDeleteTemplate,
  TEMPLATE_CHANNELS,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_CHANNEL_TEXT,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_TEXT,
  TEMPLATE_CATEGORY_LABELS,
  type Template,
  type TemplateChannel,
  type ListTemplatesParams,
} from "@/hooks/use-templates";
import { usePermissions } from "@/hooks/use-permissions";
import { ArchivedFilter, type ArchivedFilterValue } from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { TemplateFormDialog } from "@/components/communication/template-form-dialog";

function TemplatesListContent() {
  const { can } = usePermissions();
  const canCreate = can("templates", "create");
  const canUpdate = can("templates", "update");
  const canDelete = can("templates", "delete");
  const canManage = canUpdate || canDelete;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [channel, setChannel] = React.useState<TemplateChannel | "">("");
  const [statusFilter, setStatusFilter] = React.useState<"draft" | "published" | "">("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Template | null>(null);
  const [viewing, setViewing] = React.useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Template | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    template: Template;
  } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListTemplatesParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      channel: channel || undefined,
      status: statusFilter || undefined,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, search, channel, statusFilter, archivedView]
  );

  const { data, isLoading, error } = useTemplatesList(queryParams);

  const allQuery = useTemplatesList({ limit: 200, archived: archivedView ? true : undefined });
  const allTemplates = React.useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);
  const total = data?.total ?? 0;
  const templates = React.useMemo(() => data?.data ?? [], [data]);

  const published = allTemplates.filter((t) => t.status === "published").length;
  const drafts = allTemplates.filter((t) => t.status === "draft").length;

  const publishMutation = usePublishTemplate();
  const archiveMutation = useArchiveTemplate();
  const restoreArchiveMutation = useRestoreTemplate();
  const deleteMutation = useDeleteTemplate();

  const buildExportRows = React.useCallback(
    (rows: Template[]) =>
      rows.map((t) => ({
        name: t.name,
        channel: TEMPLATE_CHANNEL_LABELS[t.channel],
        status: TEMPLATE_STATUS_LABELS[t.status],
        category: t.category ? TEMPLATE_CATEGORY_LABELS[t.category] : "",
        language: t.language || "",
        variables: (t.variables ?? []).join(", "),
        created: format(new Date(t.createdAt), "yyyy-MM-dd"),
      })),
    []
  );

  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<Template>((p) =>
      api.get(listUrl("/templates", { ...queryParams, page: p, limit: 200 }))
    );
    return buildExportRows(rows);
  }, [queryParams, buildExportRows]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (template: Template) => {
    setEditing(template);
    setFormOpen(true);
  };
  const handlePublish = (template: Template) => {
    publishMutation.mutate(template.templateId, {
      onSuccess: () => toast.success(`"${template.name}" published`),
      onError: (err) =>
        toast.error("Failed to publish template", {
          description: err instanceof Error ? err.message : "Please try again.",
        }),
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.templateId);
      toast.success("Template deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete template", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Templates"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Templates" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load templates.</p>
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
        title="Templates"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Templates" }]}
        action={
          <div className="flex items-center gap-2">
            <ExportDropdown
              columns={[
                { key: "name", label: "Name" },
                { key: "channel", label: "Channel" },
                { key: "status", label: "Status" },
                { key: "category", label: "Category" },
                { key: "language", label: "Language" },
                { key: "variables", label: "Variables" },
                { key: "created", label: "Created" },
              ]}
              data={buildExportRows(templates)}
              fetchAllRows={fetchAllExportRows}
              title="Templates"
              filename="templates-export"
              disabled={templates.length === 0}
            />
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title={archivedView ? "Archived Templates" : "Total Templates"}
          value={
            archivedView
              ? allTemplates.length
              : allQuery.data?.total ?? allTemplates.length
          }
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Published"
          value={published}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Drafts"
          value={drafts}
          icon={<FileText className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ArchivedFilter
                value={archivedFilter}
                onChange={setArchivedFilter}
              />
              <select
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as TemplateChannel | "");
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">All Channels</option>
                {TEMPLATE_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {TEMPLATE_CHANNEL_LABELS[ch]}
                  </option>
                ))}
              </select>
              {!archivedView && (
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "" | "draft" | "published");
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              )}
            </div>
            <SearchInput
              value={searchInput}
              onChange={(v) => setSearchInput(v)}
              placeholder="Search templates..."
              className="w-full sm:w-64"
            />
          </div>
        }
        itemName="templates"
        page={page}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title={archivedView ? "No archived templates" : "No templates yet"}
              description={
                archivedView
                  ? "Archive a template to move it here."
                  : search
                    ? "Try adjusting your search."
                    : "Add your first template to get started."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Language</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.templateId} className="cursor-pointer" onClick={() => setViewing(template)}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 ${TEMPLATE_CHANNEL_TEXT[template.channel]}`}>
                      {TEMPLATE_CHANNEL_LABELS[template.channel]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${TEMPLATE_STATUS_TEXT[template.status]}`}>
                      {TEMPLATE_STATUS_LABELS[template.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.category ? (
                      <Badge variant="secondary">{TEMPLATE_CATEGORY_LABELS[template.category]}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.variables && template.variables.length > 0
                      ? template.variables.length
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.language || "-"}
                  </TableCell>
                  {canManage && !archivedView && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(template)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => openEdit(template)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canUpdate && template.status === "draft" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handlePublish(template);
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {canDelete && !template.archivedAt && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchiveTarget({
                                    kind: "archive",
                                    template,
                                  })
                                }
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(template)}
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
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setArchiveTarget({
                                kind: "restore",
                                template,
                              })
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
                              setArchiveTarget({
                                kind: "purge",
                                template,
                              })
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Forever
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editing}
      />

      {/* View detail */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {viewing && (
                <Badge variant="secondary">{TEMPLATE_CHANNEL_LABELS[viewing.channel]}</Badge>
              )}
              {viewing && (
                <span className={`text-sm font-medium ${viewing ? TEMPLATE_STATUS_TEXT[viewing.status] : ""}`}>
                  {viewing ? TEMPLATE_STATUS_LABELS[viewing.status] : ""}
                </span>
              )}
              {viewing?.category && (
                <Badge variant="secondary">
                  {TEMPLATE_CATEGORY_LABELS[viewing.category]}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewing?.language && (
              <p className="text-sm text-muted-foreground">Language: {viewing.language}</p>
            )}
            <div className="rounded-md border bg-muted/40 p-4 whitespace-pre-wrap text-sm">
              {viewing?.content}
            </div>
            {viewing?.variables && viewing.variables.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewing.variables.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Template</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="template"
        targetName={archiveTarget?.template.name}
        targetId={archiveTarget?.template.templateId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </div>
  );
}

export default function TemplatesListPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesListContent />
    </Suspense>
  );
}
