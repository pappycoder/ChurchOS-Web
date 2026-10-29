"use client";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { UrlTabs } from "@/components/shared/url-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";
import { ErrorState } from "@/components/shared/error-state";
import { BranchDetail } from "@/components/shared/branch-assignment";
import { SubmissionsTable } from "@/components/forms/submissions-table";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  ClipboardList,
  Globe2,
  LockKeyhole,
  MoreVertical,
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
  FIELD_TYPE_LABELS,
  FORM_STATUS_LABELS,
  FORM_STATUS_TEXT,
} from "@/hooks/use-forms";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { TableCard } from "@/components/shared/table-card";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { SubmissionDetailDialog } from "@/components/forms/submission-detail-dialog";
import { SubmissionStatusDialog } from "@/components/forms/submission-status-dialog";
import { Button } from "@/components/ui/button";

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
    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] gap-2 py-2 text-sm">
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
  const canReview = can("forms:submissions", "update");
  const canReadSubmissions = can("forms:submissions", "read");
  const canRead = can("forms:list", "read");
  const canUpdate = can("forms:list", "update");
  const canDelete = can("forms:list", "delete");

  const { data: form, isLoading, error } = useForm(formId);
  const [regenerateOpen, setRegenerateOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<
    SubmissionStatus | undefined
  >(undefined);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [selectedSubmission, setSelectedSubmission] = React.useState<
    FormSubmission | undefined
  >(undefined);
  const [reviewSubmission, setReviewSubmission] = React.useState<
    FormSubmission | undefined
  >(undefined);
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
    [page, perPage, statusFilter],
  );

  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useFormSubmissions(formId, queryParams);
  const submissions = React.useMemo(
    () => submissionsData?.data ?? [],
    [submissionsData],
  );
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
      setRegenerateOpen(false);
      toast.success("Share link regenerated. The old link no longer works.");
    } catch (err) {
      toast.error("Failed to regenerate link", {
        description: getToastErrorMessage(err, "Please try again."),
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
        description: getToastErrorMessage(err, "Please try again."),
      });
    }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(formId);
      toast.success("Form closed to new submissions");
    } catch (err) {
      toast.error("Failed to close form", {
        description: getToastErrorMessage(err, "Please try again."),
      });
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync(formId);
      toast.success("Form reopened");
    } catch (err) {
      toast.error("Failed to reopen form", {
        description: getToastErrorMessage(err, "Please try again."),
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
              <Button
                variant="outline"
                onClick={() => {
                  if (confirmDiscardChanges()) router.push("/forms");
                }}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            }
          />
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <ErrorState title="Unable to load this form" />
            <Button
              variant="outline"
              onClick={() => {
                if (confirmDiscardChanges()) router.push("/forms");
              }}
            >
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
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        onClick={() => {
          if (confirmDiscardChanges()) router.push("/forms");
        }}
      >
        <ArrowLeft className="size-4" />
        All forms
      </Button>
      {!form.archivedAt && canRead && form.status === "published" && (
        <Button
          onClick={() => {
            if (confirmDiscardChanges()) router.push(`/forms/${form.id}/fill`);
          }}
        >
          <PlayCircle className="size-4" />
          Open form
        </Button>
      )}
      {!form.archivedAt && canUpdate && (
        <Button
          variant="outline"
          onClick={() => {
            if (confirmDiscardChanges()) router.push(`/forms/${form.id}/edit`);
          }}
        >
          <Pencil className="size-4" />
          Edit form
        </Button>
      )}
      {(canUpdate || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="More form actions">
              <MoreVertical className="size-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!form.archivedAt && (
              <>
                {canUpdate && (
                  <DropdownMenuItem onSelect={() => void handleClone()}>
                    <FilePlus2 className="size-4" />
                    Clone form
                  </DropdownMenuItem>
                )}
                {canUpdate && form.isPublic && form.publicToken && (
                  <DropdownMenuItem onSelect={() => void handleShare()}>
                    <Copy className="size-4" />
                    Copy public link
                  </DropdownMenuItem>
                )}
                {canUpdate && form.status !== "closed" && (
                  <DropdownMenuItem onSelect={() => void handleClose()}>
                    <PauseCircle className="size-4" />
                    Close form
                  </DropdownMenuItem>
                )}
                {canUpdate && form.status === "closed" && (
                  <DropdownMenuItem onSelect={() => void handleReopen()}>
                    <PlayCircle className="size-4" />
                    Reopen form
                  </DropdownMenuItem>
                )}
                {canUpdate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        setArchiveTarget({ kind: "archive", form })
                      }
                    >
                      <ShieldX className="size-4" />
                      Archive form
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
            {form.archivedAt && canUpdate && (
              <DropdownMenuItem
                onSelect={() => setArchiveTarget({ kind: "restore", form })}
              >
                Restore form
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setArchiveTarget({ kind: "purge", form })}
              >
                Delete permanently
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title={form.title}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Forms", href: "/forms" },
          { label: form.title },
        ]}
        action={headerAction}
      />

      <section className="mb-6 overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-accent/40 p-5 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <BranchDetail record={form} />
            <Badge variant="outline" className={FORM_STATUS_TEXT[form.status]}>
              {FORM_STATUS_LABELS[form.status]}
            </Badge>
            {form.archivedAt && <Badge variant="destructive">Archived</Badge>}
            {form.isTemplate && (
              <Badge variant="secondary">Reusable template</Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {form.isPublic ? (
                <Globe2 className="size-3.5" />
              ) : (
                <LockKeyhole className="size-3.5" />
              )}
              {form.isPublic
                ? "Public submissions enabled"
                : "Workspace access only"}
            </span>
          </div>
          <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {form.description ||
              "Review this form’s questions, access settings and submitted responses."}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          {[
            [
              "Responses received",
              form.submissionCount.toLocaleString(),
              "For this form",
            ],
            [
              "Questions",
              form.fields.length.toString(),
              `${form.fields.filter((field) => field.required).length} required`,
            ],
            [
              "Response capacity",
              form.submissionLimit > 0
                ? form.submissionLimit.toLocaleString()
                : "Unlimited",
              form.submissionLimit > 0
                ? `${Math.max(0, form.submissionLimit - form.submissionCount)} spaces remaining`
                : "No response cap",
            ],
            [
              "Last updated",
              format(new Date(form.updatedAt), "MMM d, yyyy"),
              `Created ${format(new Date(form.createdAt), "MMM d, yyyy")}`,
            ],
          ].map(([label, value, hint]) => (
            <div key={label} className="p-4 sm:p-5">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      <UrlTabs
        defaultValue={canReadSubmissions ? "responses" : "details"}
        values={["details", ...(canReadSubmissions ? ["responses"] : [])]}
      >
        <TabsList aria-label="Form workspace">
          {canReadSubmissions && (
            <TabsTrigger value="responses">Responses</TabsTrigger>
          )}
          <TabsTrigger value="details">Questions & access</TabsTrigger>
        </TabsList>
        <TabsContent
          value="responses"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          {canReadSubmissions && (
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
                    setStatusFilter(
                      v === "all" ? undefined : (v as SubmissionStatus),
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
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
              {submissionsError ? (
                <ErrorState title="Unable to load submissions" />
              ) : submissionsLoading ? (
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
                <SubmissionsTable
                  key={form.id}
                  form={form}
                  submissions={submissions}
                  canReview={canReview}
                  busy={statusMutation.isPending}
                  onOpen={setSelectedSubmission}
                  onReject={setReviewSubmission}
                  onApprove={(submission) =>
                    statusMutation.mutate(
                      {
                        submissionId: submission.id,
                        input: { status: "approved" },
                      },
                      {
                        onSuccess: () => toast.success("Submission approved"),
                        onError: (err) =>
                          toast.error(
                            getToastErrorMessage(
                              err,
                              "Failed to approve submission",
                            ),
                          ),
                      },
                    )
                  }
                />
              )}
            </TableCard>
          )}
        </TabsContent>
        <TabsContent
          value="details"
          forceMount
          className="space-y-4 data-[state=inactive]:hidden"
        >
          <div className="mb-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section
              className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6"
              aria-labelledby="form-questions-title"
            >
              <h2
                id="form-questions-title"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <ClipboardList className="size-4 text-primary" />
                Questions in this form
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                The information respondents are asked to provide.
              </p>
              <ol className="mt-4 divide-y">
                {form.fields.map((field, index) => (
                  <li
                    key={field.key}
                    className="flex min-w-0 items-start gap-3 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">
                        {field.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {field.required ? "Required" : "Optional"}
                        </span>
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {FIELD_TYPE_LABELS[field.type]}
                        {field.options?.length
                          ? ` · ${field.options.join(" / ")}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {!form.fields.length && (
                <p className="mt-4 text-sm text-muted-foreground">
                  No questions have been added to this form.
                </p>
              )}
            </section>
            <section
              className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6"
              aria-labelledby="form-access-title"
            >
              <h2 id="form-access-title" className="text-base font-semibold">
                Access & collection
              </h2>
              <dl className="mt-3 divide-y">
                <DataRow
                  label="Accepting replies"
                  value={
                    form.archivedAt
                      ? "Archived"
                      : form.status === "published" &&
                          (form.submissionLimit === 0 ||
                            form.submissionCount < form.submissionLimit)
                        ? "Open"
                        : "Not accepting responses"
                  }
                />
                <DataRow
                  label="Audience"
                  value={
                    form.isPublic
                      ? "Anyone with the public link"
                      : "Signed-in workspace users"
                  }
                />
                <DataRow
                  label="Unique answer"
                  value={
                    form.fields.find((field) => field.key === form.uniqueField)
                      ?.label || "No unique answer required"
                  }
                />
              </dl>
              {form.isPublic && form.publicToken && canUpdate ? (
                <div className="mt-5 rounded-xl border bg-muted/30 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="size-4" />
                    Public form link
                  </p>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {createShareUrl()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Copy className="size-3.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={regenerateMutation.isPending}
                      onClick={() => setRegenerateOpen(true)}
                    >
                      <RefreshCw className="size-3.5" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {form.isPublic
                    ? "Form managers control the public share link."
                    : "A public link is not available for this form."}
                </p>
              )}
            </section>
          </div>
        </TabsContent>
      </UrlTabs>
      <ConfirmDeleteDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title="Replace the public share link?"
        description={`The existing link for "${form.title}" will stop accepting responses. Share the new link with anyone who still needs to respond. Existing submissions are kept.`}
        confirmLabel="Regenerate link"
        pendingLabel="Regenerating..."
        pending={regenerateMutation.isPending}
        onConfirm={() => void handleRegenerate()}
      />
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
