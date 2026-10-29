"use client";
import { useUrlQueryState } from "@/hooks/use-url-query-state";
import { ErrorState } from "@/components/shared/error-state";
import { SubmissionsTable } from "@/components/forms/submissions-table";

import * as React from "react";
import { getToastErrorMessage, toast } from "@/lib/toast";
import { ClipboardList, Inbox, ShieldX } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useFormsList,
  useFormSubmissions,
  useUpdateSubmissionStatus,
  type FormSubmission,
  type SubmissionStatus,
} from "@/hooks/use-forms";
import { WorkspaceHeader as PageHeader } from "@/components/workspace/workspace-presentation";
import { TableCard } from "@/components/shared/table-card";
import { SubmissionDetailDialog } from "@/components/forms/submission-detail-dialog";
import { SubmissionStatusDialog } from "@/components/forms/submission-status-dialog";
import { SearchInput } from "@/components/shared/search-input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { BranchFilter } from "@/components/shared/branch-filter";

function SubmissionsPageContent() {
  const { can } = usePermissions();
  const canUpdate = can("forms:submissions", "update");
  const canRead = can("forms:submissions", "read");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusValue, setStatusValue] = useUrlQueryState<SubmissionStatus | "">(
    "status",
    "",
    ["pending", "approved", "rejected", ""],
  );
  const statusFilter = statusValue || undefined;
  const setStatusFilter = (status: SubmissionStatus | undefined) =>
    setStatusValue(status ?? "");
  const [selectedFormId, setSelectedFormId] = useUrlQueryState("formId");
  const [branchId, setBranchId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [selectedSubmission, setSelectedSubmission] = React.useState<
    FormSubmission | undefined
  >(undefined);
  const [reviewSubmission, setReviewSubmission] = React.useState<
    FormSubmission | undefined
  >(undefined);

  const {
    data: formsData,
    isLoading: formsLoading,
    error: formsError,
  } = useFormsList({
    limit: 200,
    search: search || undefined,
    branchId: branchId || undefined,
  });
  const forms = React.useMemo(
    () => (formsData?.data ?? []).filter((f) => !f.archivedAt),
    [formsData],
  );
  const selectedForm = React.useMemo(
    () => forms.find((f) => f.id === selectedFormId),
    [forms, selectedFormId],
  );

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
      status: statusFilter,
    }),
    [page, perPage, statusFilter],
  );

  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useFormSubmissions(selectedFormId || undefined, queryParams);
  const submissions = React.useMemo(
    () => submissionsData?.data ?? [],
    [submissionsData],
  );
  const submissionsMeta = submissionsData?.meta;

  const statusMutation = useUpdateSubmissionStatus(selectedFormId);

  const quickReview = (s: FormSubmission, status: "approved" | "rejected") => {
    if (status === "rejected") {
      setReviewSubmission(s);
      return;
    }
    statusMutation.mutate(
      { submissionId: s.id, input: { status } },
      {
        onSuccess: () => toast.success("Submission approved"),
        onError: (err) =>
          toast.error("Failed to update submission", {
            description: getToastErrorMessage(err, "Please try again."),
          }),
      },
    );
  };

  if (!canRead) {
    return (
      <div>
        <PageHeader
          title="Submissions"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Submissions" },
          ]}
        />
        <div className="py-16">
          <EmptyState
            icon={<ShieldX className="h-8 w-8" />}
            title="You do not have permission to view submissions"
            description="Contact your church administrator to request access to form submissions."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        count={selectedFormId ? (submissionsMeta?.total ?? 0) : undefined}
        title="Submissions"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Forms", href: "/forms" },
          { label: "Submissions" },
        ]}
      />

      <TableCard
        title="Form Submissions"
        description={
          selectedForm
            ? `Responses for ${selectedForm.title}`
            : "Select a form to view its submissions"
        }
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
          <div className="flex flex-wrap items-center gap-2">
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setSelectedFormId("");
                setPage(1);
              }}
            />
            <Select
              value={selectedFormId}
              onValueChange={(v) => {
                setSelectedFormId(v);
                setSelectedSubmission(undefined);
                setReviewSubmission(undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter ?? "all"}
              onValueChange={(v) => {
                setStatusFilter(
                  v === "all" ? undefined : (v as SubmissionStatus),
                );
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <SearchInput
              aria-label="Search available forms"
              placeholder="Search available forms..."
              value={searchInput}
              onChange={setSearchInput}
            />
          </div>
        }
      >
        {formsError ? (
          <ErrorState title="Unable to load forms" />
        ) : formsLoading ? (
          <div className="px-4 py-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : forms.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No forms found"
              description={
                search
                  ? "No forms match your search."
                  : "Create a form to start collecting submissions."
              }
              action={
                search ? undefined : { label: "Add Form", href: "/forms/new" }
              }
            />
          </div>
        ) : !selectedForm ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title="Select a form"
              description="Choose a form above to view its submissions."
            />
          </div>
        ) : submissionsError ? (
          <ErrorState title="Unable to load submissions" />
        ) : submissionsLoading ? (
          <SubmissionsTable
            key={selectedForm.id}
            form={selectedForm}
            submissions={[]}
            loading
            canReview={canUpdate}
            onOpen={setSelectedSubmission}
            onApprove={(submission) => quickReview(submission, "approved")}
            onReject={setReviewSubmission}
          />
        ) : submissions.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title="No submissions"
              description="No responses match the current filters."
            />
          </div>
        ) : (
          <SubmissionsTable
            key={selectedForm.id}
            form={selectedForm}
            submissions={submissions}
            canReview={canUpdate}
            busy={statusMutation.isPending}
            onOpen={setSelectedSubmission}
            onApprove={(submission) => quickReview(submission, "approved")}
            onReject={setReviewSubmission}
          />
        )}
      </TableCard>

      <SubmissionDetailDialog
        form={selectedForm}
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(o) => !o && setSelectedSubmission(undefined)}
      />
      <SubmissionStatusDialog
        formId={selectedFormId}
        submission={reviewSubmission}
        open={!!reviewSubmission}
        onOpenChange={(o) => !o && setReviewSubmission(undefined)}
      />
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <React.Suspense fallback={<p role="status">Loading workspace…</p>}>
      <SubmissionsPageContent />
    </React.Suspense>
  );
}
