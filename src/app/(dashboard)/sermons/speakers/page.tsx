"use client";
import { SermonBrowseLink as Link } from "@/components/sermons/sermon-presentation";
import { usePermissions } from "@/hooks/use-permissions";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import {
  SermonHeader as PageHeader,
  sermonWorkspaceClass,
} from "@/components/sermons/sermon-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSermonsSpeakers } from "@/hooks/use-sermons";

export default function SermonsSpeakersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canBrowse = can("sermons:list", "read");
  const { data: speakers, isLoading, error } = useSermonsSpeakers();

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const pagedSpeakers = React.useMemo(
    () => (speakers ?? []).slice((page - 1) * perPage, page * perPage),
    [speakers, page, perPage],
  );

  if (error) {
    return (
      <div>
        <PageHeader
          title="Speakers"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Speakers" },
          ]}
        />
        <ErrorState title="Failed to load speakers." />
      </div>
    );
  }

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : (speakers?.length ?? 0)}
        title="Speakers"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Speakers" },
        ]}
      />

      <TableCard
        description="Select a speaker to browse its sermons."
        itemName="speakers"
        page={page}
        perPage={perPage}
        total={speakers?.length ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <LoadingState variant="table" />
        ) : !speakers || speakers.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No speakers yet"
              description="Speakers are tracked when you add a speaker name to a sermon."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Speaker</TableHead>
                <TableHead>Sermons</TableHead>
                <TableHead>Last Spoke</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSpeakers.map((s) => (
                <TableRow
                  key={s.name}
                  className={canBrowse ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (canBrowse && confirmDiscardChanges())
                      router.push(
                        `/sermons?speaker=${encodeURIComponent(s.name)}`,
                      );
                  }}
                >
                  <TableCell className="font-medium">
                    <Link
                      enabled={canBrowse}
                      href={`/sermons?speaker=${encodeURIComponent(s.name)}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300">
                        <Users className="size-3.5" aria-hidden="true" />
                      </span>
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal tabular-nums"
                    >
                      {s.count} {s.count === 1 ? "sermon" : "sermons"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.lastDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(s.lastDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  );
}
