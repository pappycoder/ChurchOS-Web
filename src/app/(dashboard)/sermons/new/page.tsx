"use client";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  SermonHeader as PageHeader,
  sermonWorkspaceClass,
} from "@/components/sermons/sermon-presentation";
import { Button } from "@/components/ui/button";
import { SermonForm } from "@/components/sermons/sermon-form";
import { useCreateSermon, type CreateSermonInput } from "@/hooks/use-sermons";
import { usePermissions } from "@/hooks/use-permissions";

export default function NewSermonPage() {
  const router = useRouter();
  const { canAny } = usePermissions();
  const canCreate = canAny("sermons:new:create");
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
          <p className="text-muted-foreground">
            You do not have permission to create sermons.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (input: CreateSermonInput) => {
    const saved = await createMutation.mutateAsync(input);
    router.replace(`/sermons/${saved.sermonId}/edit`);
    return saved;
  };

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        title="Add Sermon"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Add Sermon" },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => {
              if (confirmDiscardChanges()) router.back();
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <SermonForm onSubmit={handleSubmit} />
    </div>
  );
}
