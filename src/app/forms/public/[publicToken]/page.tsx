"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSubmitFormPublic, type FormField } from "@/hooks/use-forms";
import { FormFieldsRenderer } from "@/components/forms/form-fields-renderer";
import { SubmissionAttachments } from "@/components/forms/submission-attachments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicFormPayload {
  title: string;
  description?: string;
  fields: FormField[];
}

export default function PublicFormPage() {
  const params = useParams<{ publicToken: string }>();
  const publicToken = params.publicToken;
  const [data, setData] = React.useState<Record<string, unknown>>({});
  const [assetIds, setAssetIds] = React.useState<string[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [failed, setFailed] = React.useState<string | null>(null);

  const publicMutation = useSubmitFormPublic(publicToken);

  const [form, setForm] = React.useState<PublicFormPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/forms/public/${publicToken}/meta`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          setFailed("This form link is invalid or no longer active.");
          return;
        }
        const envelope = await res.json();
        if (active) setForm(envelope.data as PublicFormPayload);
      } catch {
        if (active) setFailed("Unable to load this form. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [publicToken]);

  const requiredMissing = () => {
    if (!form) return false;
    return form.fields.some((f) => {
      if (!f.required) return false;
      const value = data[f.key];
      return value === undefined || value === null || value === "" ||
        (Array.isArray(value) && value.length === 0);
    });
  };

  const handleSubmit = async () => {
    if (!form) return;
    if (requiredMissing()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setFailed(null);
    try {
      await publicMutation.mutateAsync({
        data,
        attachmentAssetIds: assetIds.length > 0 ? assetIds : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setFailed(err instanceof Error ? err.message : "Unable to submit. Please try again.");
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </PublicShell>
    );
  }

  if (failed && !form) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-medium">{failed}</p>
        </div>
      </PublicShell>
    );
  }

  if (submitted) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h1 className="text-xl font-semibold">Thank you!</h1>
          <p className="text-sm text-muted-foreground">
            Your response has been submitted successfully.
          </p>
        </div>
      </PublicShell>
    );
  }

  if (!form) return null;

  return (
    <PublicShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{form.title}</h1>
          {form.description && (
            <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
          )}
        </div>

        <FormFieldsRenderer fields={form.fields} onChange={setData} disabled={publicMutation.isPending} />

        <SubmissionAttachments onChange={setAssetIds} disabled={publicMutation.isPending} />

        {failed && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {failed}
          </div>
        )}

        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={publicMutation.isPending}
        >
          {publicMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto w-full max-w-xl px-4">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <ClipboardList className="h-5 w-5 text-primary" />
          Form
        </div>
        <div className="rounded-lg border bg-background p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
