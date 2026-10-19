"use client";

import { format } from "date-fns";
import { Check, Eye, X } from "lucide-react";
import {
  type Form,
  type FormSubmission,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_TEXT,
} from "@/hooks/use-forms";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function submissionValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(submissionValue).join(", ") || "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function SubmissionsTable({
  form,
  submissions,
  loading = false,
  canReview,
  busy = false,
  onOpen,
  onApprove,
  onReject,
}: {
  form: Form;
  submissions: FormSubmission[];
  loading?: boolean;
  canReview: boolean;
  busy?: boolean;
  onOpen: (submission: FormSubmission) => void;
  onApprove: (submission: FormSubmission) => void;
  onReject: (submission: FormSubmission) => void;
}) {
  // A configured unique answer is the best identifier; names/email come next.
  const primary =
    form.fields.find((field) => field.key === form.uniqueField) ??
    form.fields.find((field) =>
      /(^|[\s_])(name|full.?name)($|[\s_])/i.test(`${field.label} ${field.key}`),
    ) ??
    form.fields.find((field) => field.type === "email") ??
    form.fields[0];
  const fields = primary
    ? [primary, ...form.fields.filter((field) => field.key !== primary.key)]
    : [];
  const columnCount = 6 + Math.max(1, fields.length);
  return (
    <Table tableId={`submissions-${form.id}`} aria-label={`${form.title} submissions`} exportable>
      <TableHeader>
        <TableRow>
          <TableHead hideable={false}>Submission reference</TableHead>
          {fields.length ? (
            fields.map((field, index) => (
              <TableHead key={field.key} hideable={index !== 0} columnLabel={field.label}>
                {field.label}
                {field.required && (
                  <span className="ml-1 text-muted-foreground" aria-label="required">
                    *
                  </span>
                )}
              </TableHead>
            ))
          ) : (
            <TableHead hideable={false}>Response</TableHead>
          )}
          <TableHead>Status</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Attachments</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>
                {Array.from({ length: columnCount }, (_, column) => (
                  <TableCell key={column}>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : submissions.map((submission) => (
              <TableRow
                key={submission.id}
                className="cursor-pointer"
                onClick={() => onOpen(submission)}
              >
                <TableCell>
                  <Button
                    variant="link"
                    className="h-auto max-w-full justify-start p-0 font-mono text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(submission);
                    }}
                    title={submission.id}
                  >
                    <span className="truncate">{submission.id}</span>
                  </Button>
                </TableCell>
                {fields.length ? (
                  fields.map((field) => {
                    const value = submissionValue(submission.data[field.key]);
                    return (
                      <TableCell key={field.key} title={value}>
                        <span className="block max-w-56 truncate">{value}</span>
                      </TableCell>
                    );
                  })
                ) : (
                  <TableCell>Open response</TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className={SUBMISSION_STATUS_TEXT[submission.status]}>
                    {SUBMISSION_STATUS_LABELS[submission.status]}
                  </Badge>
                </TableCell>
                <TableCell>{submission.submittedBy ? "Signed in" : "Public"}</TableCell>
                <TableCell>
                  {format(new Date(submission.createdAt), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>{submission.attachments?.length ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end gap-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`View submission ${submission.id}`}
                      onClick={() => onOpen(submission)}
                    >
                      <Eye />
                    </Button>
                    {canReview && submission.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-emerald-600"
                          aria-label={`Approve submission ${submission.id}`}
                          disabled={busy}
                          onClick={() => onApprove(submission)}
                        >
                          <Check />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          aria-label={`Reject submission ${submission.id}`}
                          disabled={busy}
                          onClick={() => onReject(submission)}
                        >
                          <X />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
