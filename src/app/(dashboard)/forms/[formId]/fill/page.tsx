"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useForm, useSubmitForm } from "@/hooks/use-forms";
import { FormFieldsRenderer } from "@/components/forms/form-fields-renderer";
import { SubmissionAttachments } from "@/components/forms/submission-attachments";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function FillFormPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const { can, ready } = usePermissions();
  const canRead = can("forms", "read");

  const { data: form, isLoading, error } = useForm(formId);
  const submitMutation = useSubmitForm(formId);

  const [data, setData] = React.useState<Record<string, unknown>>({});
  const [assetIds, setAssetIds] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = React.useState(false);
  const [failMsg, setFailMsg] = React.useState<string | null>(null);

  const notFillable = form && (form.status === "closed" || !!form.archivedAt);

  const requiredMissing = () => {
    if (!form) return false;
    return form.fields.some((f) => {
      if (!f.required) return false;
      const value = data[f.key];
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    });
  };

  const handleSubmit = async () => {
    if (!form) return;
    if (requiredMissing()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setFailMsg(null);
    try {
      await submitMutation.mutateAsync({
        data,
        attachmentAssetIds: assetIds.length > 0 ? assetIds : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error && "statusCode" in err && (err as { statusCode?: number }).statusCode === 409) {
        setAlreadySubmitted(true);
      } else {
        setFailMsg(err instanceof Error ? err.message : "Unable to submit. Please try again.");
      }
    }
  };

  const header = (
    <PageHeader
      title="Fill in form"
      breadcrumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "Forms", href: "/forms" },
        { label: form?.title ?? "Form" },
      ]}
      action={
        <Button variant="outline" onClick={() => router.push(`/forms/${formId}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      }
    />
  );

  if (!ready) {
    return (
      <div>
        {header}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div>
        {header}
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">You don&apos;t have access to forms.</p>
          <Button variant="outline" onClick={() => router.push("/forms")}>
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  if (error || !form) {
    if (error) {
      return (
        <div>
          {header}
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
          {header}
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      );
    }
    return null;
  }

  if (notFillable) {
    return (
      <div>
        {header}
        <div className="flex flex-col items-center gap-3 rounded-md border p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
          <p className="font-medium">
            {form.status === "closed" ? "This form is closed" : "This form is archived"}
          </p>
          <p className="text-sm text-muted-foreground">
            This form is not accepting new submissions.
          </p>
          <Button variant="outline" className="mt-2" onClick={() => router.push(`/forms/${formId}`)}>
            View form details
          </Button>
        </div>
      </div>
    );
  }

  if (submitted || alreadySubmitted) {
    return (
      <div>
        {header}
        <div className="flex flex-col items-center gap-3 rounded-md border p-12 text-center">
          <CheckCircle2
            className={`h-12 w-12 ${alreadySubmitted ? "text-sky-600" : "text-emerald-600"}`}
          />
          <p className="text-xl font-semibold">
            {alreadySubmitted ? "Already submitted" : "Thank you!"}
          </p>
          <p className="text-sm text-muted-foreground">
            {alreadySubmitted
              ? "A response for this form has already been recorded for your account."
              : "Your response has been submitted successfully."}
          </p>
          <Button variant="outline" className="mt-2" onClick={() => router.push(`/forms/${formId}`)}>
            View form details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{form.title}</h1>
          {form.description && (
            <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>

        <FormFieldsRenderer
          fields={form.fields}
          onChange={setData}
          disabled={submitMutation.isPending}
        />

        <SubmissionAttachments
          onChange={setAssetIds}
          disabled={submitMutation.isPending}
        />

        {failMsg && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {failMsg}
          </div>
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Submitted as a member of your church.
        </p>

        <Button type="button" onClick={handleSubmit} disabled={submitMutation.isPending}>
          {submitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
}
