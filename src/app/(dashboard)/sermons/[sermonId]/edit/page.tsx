"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  SermonHeader as PageHeader,
  sermonWorkspaceClass,
} from "@/components/sermons/sermon-presentation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SermonForm } from "@/components/sermons/sermon-form";
import {
  useSermon,
  useUpdateSermon,
  type UpdateSermonInput,
} from "@/hooks/use-sermons";
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
          <p className="text-muted-foreground">
            You do not have permission to edit sermons.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${sermonWorkspaceClass} space-y-4`}>
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
            { label: "Unavailable" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-destructive">
            Unable to load this sermon. Retry or return to the sermon directory.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.push("/sermons");
            }}
          >
            Back to Sermons
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (input: UpdateSermonInput) =>
    updateMutation.mutateAsync(input);

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        title="Edit Sermon"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: sermon.title },
          { label: "Edit" },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.push(`/sermons/${sermonId}`);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            View Sermon
          </Button>
        }
      />
      <SermonForm
        sermon={sermon}
        onSubmit={handleSubmit}
        onSaveRecording={handleSubmit}
      />
    </div>
  );
}
