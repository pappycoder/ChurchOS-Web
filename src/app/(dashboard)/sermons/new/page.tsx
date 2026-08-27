"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SermonForm } from "@/components/sermons/sermon-form";
import { useCreateSermon, type CreateSermonInput } from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";

export default function NewSermonPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("sermons", "create");
  const createMutation = useCreateSermon();

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="Add Sermon"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Add Sermon" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">You do not have permission to create sermons.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (input: CreateSermonInput) => {
    try {
      await createMutation.mutateAsync(input);
      toast.success("Sermon created");
      router.push("/sermons");
    } catch (err) {
      toast.error("Failed to create sermon", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add Sermon"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Add Sermon" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <SermonForm onSubmit={handleSubmit} submitLabel="Create Sermon" />
    </div>
  );
}
