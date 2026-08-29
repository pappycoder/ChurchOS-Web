"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FilePlus2,
  Link2,
  PauseCircle,
  Pencil,
  PlayCircle,
  RefreshCw,
  ShieldX,
  XCircle,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useForm,
  useFormSubmissions,
  useDeleteForm,
  useArchiveForm,
  useRestoreForm,
  useCloneForm,
  useRegenerateLink,
  useCloseForm,
  useReopenForm,
  useUpdateSubmissionStatus,
  type Form,
  type FormSubmission,
  type SubmissionStatus,
  FORM_STATUS_LABELS,
  FORM_STATUS_TEXT,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TEXT,
} from "@/hooks/use-forms";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { SubmissionDetailDialog } from "@/components/forms/submission-detail-dialog";
import { SubmissionStatusDialog } from "@/components/forms/submission-status-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

function DataRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default function FormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  const { can } = usePermissions();
  const canCreate = can("forms", "create");
  const canRead = can("forms", "read");
  const canUpdate = can("forms", "update");
  const canDelete = can("forms", "delete");

  const { data: form, isLoading, error } = useForm(formId);
  const [statusFilter, setStatusFilter] = React.useState<SubmissionStatus | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [selectedSubmission, setSelectedSubmission] = React.useState<FormSubmission | undefined>(undefined);
  const [reviewSubmission, setReviewSubmission] = React.useState<FormSubmission | undefined>(undefined);
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    form: Form;
  } | null>(null);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      status: statusFilter,
    }),
    [page, perPage, statusFilter]
  );

  const { data: submissionsData, isLoading: submissionsLoading } = useFormSubmissions(
    formId,
    queryParams
  );
  const submissions = React.useMemo(() => submissionsData?.data ?? [], [submissionsData]);
  const submissionsMeta = submissionsData?.meta;

  const archiveMutation = useArchiveForm();
  const restoreMutation = useRestoreForm();
  const deleteMutation = useDeleteForm();
  const cloneMutation = useCloneForm();
  const regenerateMutation = useRegenerateLink();
  const closeMutation = useCloseForm();
  const reopenMutation = useReopenForm();
  const statusMutation = useUpdateSubmissionStatus(formId);

  const createShareUrl = () => {
    if (!form?.publicToken) return "";
    return `${window.location.origin}/forms/public/${form.publicToken}`;
  };

  const handleShare = async () => {
    const url = createShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy share link");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync(formId);
      toast.success("Share link regenerated. The old link no longer works.");
    } catch (err) {
      toast.error("Failed to regenerate link", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleClone = async () => {
    try {
      const cloned = await cloneMutation.mutateAsync(formId);
      toast.success("Form cloned");
      router.push(`/forms/${cloned.id}`);
    } catch (err) {
      toast.error("Failed to clone form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(formId);
      toast.success("Form closed to new submissions");
    } catch (err) {
      toast.error("Failed to close form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync(formId);
      toast.success("Form reopened");
    } catch (err) {
      toast.error("Failed to reopen form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (error || !form) {
    if (error) {
      return (
        <div>
          <PageHeader
            title="Form"
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Forms", href: "/forms" },
              { label: "Form" },
            ]}
            action={
              <Button variant="outline" onClick={() => router.push("/forms")}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            }
          />
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">Failed to load this form.</p>
            <Button variant="outline" onClick={() => router.push("/forms")}>
              Back to Forms
            </Button>
          </div>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div>
          <PageHeader
            title="Form"
            breadcrumbs={[
              { label: "Home", href: "/dashboard" },
              { label: "Forms", href: "/forms" },
              { label: "Form" },
            ]}
          />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      );
    }
    return null;
  }

  const headerAction = (
    <div className="flex items-center gap-2">
      {form.archivedAt && (
        <Badge variant="destructive" className="mr-2">
          Archived
        </Badge>
      )}
      {!form.archivedAt && (
        <>
          {canCreate && (
            <Button variant="outline" onClick={handleClone}>
              <FilePlus2 className="mr-1 h-4 w-4" />
              Clone
            </Button>
          )}
          {canRead && form.status === "published" && (
            <Button variant="outline" onClick={() => router.push(`/forms/${form.id}/fill`)}>
              <PlayCircle className="mr-1 h-4 w-4" />
              Open
            </Button>
          )}
          {canUpdate && (form.status === "draft" || form.status === "published") && (
            <Button variant="outline" onClick={handleClose}>
              <PauseCircle className="mr-1 h-4 w-4" />
              Close
            </Button>
          )}
          {canUpdate && form.status === "closed" && (
            <Button variant="outline" onClick={handleReopen}>
              <PlayCircle className="mr-1 h-4 w-4" />
              Reopen
            </Button>
          )}
          {canUpdate && form.isPublic && (
            <Button variant="outline" onClick={handleShare}>
              <Copy className="mr-1 h-4 w-4" />
              Copy Link
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => router.push(`/forms/${form.id}/edit`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" onClick={() => setArchiveTarget({ kind: "archive", form })}>
              <ShieldX className="mr-1 h-4 w-4" />
              Archive
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setArchiveTarget({ kind: "purge", form })}>
              Delete
            </Button>
          )}
        </>
      )}
      {form.archivedAt && canUpdate && (
        <Button variant="outline" onClick={() => setArchiveTarget({ kind: "restore", form })}>
          Restore
        </Button>
      )}
      {form.archivedAt && canDelete && (
        <Button variant="destructive" onClick={() => setArchiveTarget({ kind: "purge", form })}>
          Delete Forever
        </Button>
      )}
      <Button variant="outline" onClick={() => router.push("/forms")}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={form.title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Forms", href: "/forms" },
          { label: form.title },
        ]}
        action={headerAction}
      />

      <div className="mb-4 rounded-md border p-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <dl>
              <DataRow label="Status" value={
                <Badge variant="outline" className={FORM_STATUS_TEXT[form.status]}>
                  {FORM_STATUS_LABELS[form.status]}
                </Badge>
              } />
              <DataRow
                label="Created"
                value={format(new Date(form.createdAt), "MMM d, yyyy")}
              />
              <DataRow
                label="Updated"
                value={format(new Date(form.updatedAt), "MMM d, yyyy")}
              />
              <DataRow label="Fields" value={`${form.fields.length} field${form.fields.length === 1 ? "" : "s"}`} />
              <DataRow label="Template" value={form.isTemplate ? "Yes" : "No"} />
              <DataRow label="Submission limit" value={form.submissionLimit > 0 ? `${form.submissionLimit}` : "Unlimited"} />
              <DataRow label="Submissions" value={`${form.submissionCount}`} />
              {form.uniqueField && (
                <DataRow label="Unique field" value={form.uniqueField} />
              )}
            </dl>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Public submissions</p>
            {form.isPublic ? (
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Share link</span>
                  {canUpdate && (
                    <Button variant="ghost" size="xs" onClick={handleRegenerate}>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Regenerate
                    </Button>
                  )}
                </div>
                <p className="mt-1 break-all text-xs text-muted-foreground">{createShareUrl()}</p>
                {canUpdate && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleShare}>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy link
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Public submissions are disabled. Enable &quot;Public Submissions&quot; and publish
                the form to generate a shareable link.
              </p>
            )}
          </div>
        </div>
      </div>

      <TableCard
        title="Submissions"
        description={`${submissionsMeta?.total ?? 0} total`}
        itemName="submissions"
        page={page}
        perPage={perPage}
        total={submissionsMeta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(p) => {
          setPerPage(p);
          setPage(1);
        }}
        toolbar={
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? undefined : (v as SubmissionStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        {submissionsLoading ? (
          <div className="px-4 py-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="No submissions yet"
              description={
                form.isPublic && form.status === "published"
                  ? "Share the link to start collecting responses."
                  : "Submit the form to collect your first response."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedSubmission(s)}>
                  <TableCell>
                    <Badge variant="outline" className={SUBMISSION_STATUS_TEXT[s.status]}>
                      {SUBMISSION_STATUS_LABELS[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.submittedBy ? "Member" : "Public"}</TableCell>
                  <TableCell>{format(new Date(s.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell className="text-right">
                    {s.status === "pending" && canUpdate && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-emerald-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            statusMutation.mutate({
                              submissionId: s.id,
                              input: { status: "approved" },
                            });
                          }}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewSubmission(s);
                          }}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <SubmissionDetailDialog
        form={form}
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(o) => !o && setSelectedSubmission(undefined)}
      />
      <SubmissionStatusDialog
        formId={formId}
        submission={reviewSubmission}
        open={!!reviewSubmission}
        onOpenChange={(o) => !o && setReviewSubmission(undefined)}
      />
      {archiveTarget && (
        <ArchiveConfirmDialog
          open={!!archiveTarget}
          onOpenChange={(o) => !o && setArchiveTarget(null)}
          kind={archiveTarget.kind}
          entityLabel="form"
          targetName={form.title}
          targetId={formId}
          mutation={
            archiveTarget.kind === "archive"
              ? archiveMutation
              : archiveTarget.kind === "restore"
                ? restoreMutation
                : deleteMutation
          }
          onConfirmed={() => {
            if (archiveTarget.kind === "purge") {
              router.push("/forms");
            } else {
              setArchiveTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
