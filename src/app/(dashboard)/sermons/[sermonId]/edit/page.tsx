"use client";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SermonForm } from "@/components/sermons/sermon-form";
import { useSermon, useUpdateSermon, type CreateSermonInput } from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";

export default function EditSermonPage() {
  const router = useRouter();
  const params = useParams();
  const sermonId = params.sermonId as string;
  const { can } = usePermissions();
  const canUpdate = can("sermons", "update");

  const { data: sermon, isLoading, error } = useSermon(sermonId);
  const updateMutation = useUpdateSermon(sermonId);

  if (!canUpdate) {
    return (
      <div>
        <PageHeader
          title="Edit Sermon"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Edit" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">You do not have permission to edit sermons.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div>
        <PageHeader
          title="Edit Sermon"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Not Found" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-destructive">Sermon not found.</p>
          <Button variant="outline" onClick={() => router.push("/sermons")}>
            Back to Sermons
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (input: CreateSermonInput) => {
    try {
      await updateMutation.mutateAsync(input);
      toast.success("Sermon updated");
      router.push(`/sermons/${sermonId}`);
    } catch (err) {
      toast.error("Failed to update sermon", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Sermon"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: sermon.title },
          { label: "Edit" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <SermonForm sermon={sermon} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
