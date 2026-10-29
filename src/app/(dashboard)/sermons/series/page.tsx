"use client";
import { SermonBrowseLink as Link } from "@/components/sermons/sermon-presentation";
import { usePermissions } from "@/hooks/use-permissions";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar } from "lucide-react";
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
import { useSermonsSeries } from "@/hooks/use-sermons";

export default function SermonsSeriesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canBrowse = can("sermons:list", "read");
  const { data: series, isLoading, error } = useSermonsSeries();

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const pagedSeries = React.useMemo(
    () => (series ?? []).slice((page - 1) * perPage, page * perPage),
    [series, page, perPage],
  );

  if (error) {
    return (
      <div>
        <PageHeader
          title="Series"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Sermons", href: "/sermons" },
            { label: "Series" },
          ]}
        />
        <ErrorState title="Failed to load series." />
      </div>
    );
  }

  return (
    <div className={`${sermonWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : (series?.length ?? 0)}
        title="Series"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Series" },
        ]}
      />

      <TableCard
        description="Select a series to browse its sermons."
        itemName="series"
        page={page}
        perPage={perPage}
        total={series?.length ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <LoadingState variant="table" />
        ) : !series || series.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="No series yet"
              description="Series are created when you assign a series name to a sermon."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series Name</TableHead>
                <TableHead>Sermons</TableHead>
                <TableHead>Last Preached</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSeries.map((s) => (
                <TableRow
                  key={s.name}
                  className={canBrowse ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (canBrowse && confirmDiscardChanges())
                      router.push(
                        `/sermons?series=${encodeURIComponent(s.name)}`,
                      );
                  }}
                >
                  <TableCell className="font-medium">
                    <Link
                      enabled={canBrowse}
                      href={`/sermons?series=${encodeURIComponent(s.name)}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                        <BookOpen className="size-3.5" aria-hidden="true" />
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
