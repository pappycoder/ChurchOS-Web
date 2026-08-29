"use client";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useForm, useUpdateForm } from "@/hooks/use-forms";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FormForm } from "@/components/forms/form-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldX } from "lucide-react";

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  const { can } = usePermissions();
  const canUpdate = can("forms", "update");

  const { data: form, isLoading, error } = useForm(formId);
  const updateMutation = useUpdateForm(formId);

  if (!canUpdate) {
    return (
      <div>
        <PageHeader
          title="Edit Form"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Edit Form" },
          ]}
        />
        <div className="py-16">
          <EmptyState
            icon={<ShieldX className="h-8 w-8" />}
            title="You do not have permission to edit forms"
            description="Contact your church administrator to request forms:update access."
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Edit Form"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Edit Form" },
          ]}
        />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div>
        <PageHeader
          title="Edit Form"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Edit Form" },
          ]}
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

  const handleSubmit = async (input: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    try {
      await updateMutation.mutateAsync(input);
      toast.success("Form updated");
      router.push(`/forms/${formId}`);
    } catch (err) {
      toast.error("Failed to update form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      throw err;
    }
  };

  return (
    <div>
      <PageHeader
        title={`Edit: ${form.title}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Forms", href: "/forms" },
          { label: form.title, href: `/forms/${form.id}` },
          { label: "Edit" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        }
      />
      <FormForm form={form} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
