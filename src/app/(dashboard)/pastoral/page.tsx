"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  usePastoralNotes,
  useDeletePastoralNote,
  useArchivePastoralNote,
  useRestorePastoralNote,
  type PastoralNote,
  type ConfidentialityLevel,
  CONFIDENTIALITY_LABELS,
  CONFIDENTIALITY_TEXT,
} from "@/hooks/use-pastoral";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
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
import { NoteFormDialog } from "@/components/pastoral/note-form-dialog";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { cn } from "@/lib/utils";

const CONFIDENTIALITY_OPTIONS: Array<{ value: ConfidentialityLevel | "all"; label: string }> = [
  { value: "all", label: "All Levels" },
  ...Object.entries(CONFIDENTIALITY_LABELS).map(([value, label]) => ({
    value: value as ConfidentialityLevel,
    label,
  })),
];

export default function PastoralNotesPage() {
  const { can } = usePermissions();
  const canCreate = can("pastoral", "create");
  const canUpdate = can("pastoral", "update");
  const canDelete = can("pastoral", "delete");
  const canManage = canCreate || canUpdate || canDelete;

  const [confidentiality, setConfidentiality] = React.useState<
    ConfidentialityLevel | "all"
  >("all");
  const [archivedFilter, setArchivedFilter] = React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      confidentiality: confidentiality === "all" ? undefined : confidentiality,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, confidentiality, archivedView]
  );

  const { data, isLoading, error } = usePastoralNotes(queryParams);
  const deleteMutation = useDeletePastoralNote();
  const archiveMutation = useArchivePastoralNote();
  const restoreMutation = useRestorePastoralNote();

  const notes = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editNote, setEditNote] = React.useState<PastoralNote | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PastoralNote | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    note: PastoralNote;
  } | null>(null);

  if (error) {
    return (
      <div>
        <PageHeader
          title="Pastoral Notes"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Pastoral Care" },
            { label: "Notes" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load pastoral notes.</p>
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
        title="Pastoral Notes"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Pastoral Care" },
          { label: "Notes" },
        ]}
        action={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )
        }
      />

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <ArchivedFilter value={archivedFilter} onChange={setArchivedFilter} />
              <Select
                value={confidentiality}
                onValueChange={(v) => {
                  setConfidentiality(v as ConfidentialityLevel | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENTIALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StickyNote className="h-4 w-4" />
              {meta?.total ?? 0} notes
            </div>
          </div>
        }
        itemName="notes"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
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
        ) : notes.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<StickyNote className="h-12 w-12" />}
              title={archivedView ? "No archived notes" : "No notes found"}
              description={
                archivedView
                  ? "Archive a note to move it here."
                  : confidentiality !== "all"
                    ? "Try adjusting the confidentiality filter."
                    : canCreate
                      ? "Add your first note to start tracking pastoral care."
                      : "No pastoral notes have been recorded yet."
              }
            />
          </div>
        ) : (
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Confidentiality</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell>
                        <p className="font-medium">
                          {note.memberFirstName} {note.memberLastName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-normal",
                            CONFIDENTIALITY_TEXT[note.confidentiality]
                          )}
                        >
                          {CONFIDENTIALITY_LABELS[note.confidentiality]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(note.tags ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {note.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                            {(note.tags ?? []).length > 3 && (
                              <span className="text-xs text-muted-foreground self-center">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {note.content}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {note.authorFirstName} {note.authorLastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      {canManage && (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {archivedView ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {canUpdate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setArchiveTarget({ kind: "restore", note })}
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                  Restore
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setArchiveTarget({ kind: "purge", note })}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Delete Forever
                                </Button>
                              )}
                            </div>
                          ) : (
                            (canUpdate || canDelete) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canUpdate && (
                                    <DropdownMenuItem onClick={() => setEditNote(note)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit Note
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setArchiveTarget({ kind: "archive", note })
                                        }
                                      >
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setDeleteTarget(note)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
      </TableCard>

      <NoteFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <NoteFormDialog
        open={!!editNote}
        onOpenChange={(open) => !open && setEditNote(null)}
        note={editNote}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Note"
        description={
          deleteTarget
            ? `This will permanently delete the note about ${deleteTarget.memberFirstName} ${deleteTarget.memberLastName}. This action cannot be undone.`
            : ""
        }
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (error) => {
              toast.error("Failed to delete note", {
                description: error?.message || "Please try again.",
              });
            },
          });
        }}
      />
      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="note"
        targetName={null}
        targetId={archiveTarget?.note.id ?? ""}
        mutation={
          archiveTarget?.kind === "archive"
            ? archiveMutation
            : archiveTarget?.kind === "restore"
              ? restoreMutation
              : deleteMutation
        }
      />
    </div>
  );
}