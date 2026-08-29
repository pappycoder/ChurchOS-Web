"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClipboardList, Inbox, ShieldX } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useFormsList,
  useFormSubmissions,
  useUpdateSubmissionStatus,
  type FormSubmission,
  type SubmissionStatus,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TEXT,
} from "@/hooks/use-forms";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
import { SubmissionDetailDialog } from "@/components/forms/submission-detail-dialog";
import { SubmissionStatusDialog } from "@/components/forms/submission-status-dialog";
import { SearchInput } from "@/components/shared/search-input";
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

export default function SubmissionsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdate = can("forms", "update");
  const canRead = can("forms", "read");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<SubmissionStatus | undefined>(undefined);
  const [selectedFormId, setSelectedFormId] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [selectedSubmission, setSelectedSubmission] = React.useState<FormSubmission | undefined>(undefined);
  const [reviewSubmission, setReviewSubmission] = React.useState<FormSubmission | undefined>(undefined);

  const { data: formsData, isLoading: formsLoading } = useFormsList({
    limit: 200,
    search: search || undefined,
  });
  const forms = React.useMemo(() => (formsData?.data ?? []).filter((f) => !f.archivedAt), [formsData]);
  const selectedForm = React.useMemo(
    () => forms.find((f) => f.id === selectedFormId),
    [forms, selectedFormId]
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
    [page, perPage, statusFilter]
  );

  const { data: submissionsData, isLoading: submissionsLoading } = useFormSubmissions(
    selectedFormId || undefined,
    queryParams
  );
  const submissions = React.useMemo(() => submissionsData?.data ?? [], [submissionsData]);
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
            description: err instanceof Error ? err.message : "Please try again.",
          }),
      }
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
            description="Contact your church administrator to request forms:read access."
          />
        </div>
      </div>
    );
  }

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

      <TableCard
        title="Form Submissions"
        description={selectedForm ? `Responses for ${selectedForm.title}` : "Select a form to view its submissions"}
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
            <Select
              value={selectedFormId}
              onValueChange={(v) => {
                setSelectedFormId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[220px]">
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
                setStatusFilter(v === "all" ? undefined : (v as SubmissionStatus));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <SearchInput placeholder="Search forms..." value={searchInput} onChange={setSearchInput} />
          </div>
        }
      >
        {formsLoading ? (
          <div className="px-4 py-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : forms.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No forms found"
              description={search ? "No forms match your search." : "Create a form to start collecting submissions."}
              action={search ? undefined : { label: "Add Form", href: "/forms/new" }}
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
        ) : submissionsLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted</TableHead>
                {canUpdate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  {canUpdate && <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : submissions.length === 0 ? (
          <div className="px-4 py-12">
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title="No submissions"
              description="No responses match the current filters."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted</TableHead>
                {canUpdate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedSubmission(s)}
                >
                  <TableCell>
                    <Badge variant="outline" className={SUBMISSION_STATUS_TEXT[s.status]}>
                      {SUBMISSION_STATUS_LABELS[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/forms/${selectedForm.id}`);
                        }}
                      >
                        {selectedForm.title}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(s.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                  {canUpdate && (
                    <TableCell className="text-right">
                      {s.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-emerald-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              quickReview(s, "approved");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              quickReview(s, "rejected");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
