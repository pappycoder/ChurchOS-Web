"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useCreateForm } from "@/hooks/use-forms";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FormForm } from "@/components/forms/form-form";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function NewFormPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("forms", "create");
  const createMutation = useCreateForm();

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="New Form"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "New Form" },
          ]}
        />
        <div className="py-16">
          <EmptyState
            icon={<ShieldX className="h-8 w-8" />}
            title="You do not have permission to create forms"
            description="Contact your church administrator to request forms:create access."
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      const created = await createMutation.mutateAsync(input);
      toast.success("Form created");
      router.push(`/forms/${created.id}`);
    } catch (err) {
      toast.error("Failed to create form", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      throw err;
    }
  };

  return (
    <div>
      <PageHeader
        title="New Form"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Forms", href: "/forms" },
          { label: "New Form" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/forms")}>
            Back
          </Button>
        }
      />
      <FormForm onSubmit={handleSubmit} submitLabel="Create Form" />
    </div>
  );
}
