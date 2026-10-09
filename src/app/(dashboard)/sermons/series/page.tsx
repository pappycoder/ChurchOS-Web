"use client";

import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
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
  const { data: series, isLoading, error } = useSermonsSeries();

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const pagedSeries = React.useMemo(
    () => (series ?? []).slice((page - 1) * perPage, page * perPage),
    [series, page, perPage]
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
        <ErrorState title="Failed to load series." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Series"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Series" },
        ]}
      />

      <TableCard
        description={
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {series?.length ?? 0} series
          </div>
        }
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
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/sermons?series=${encodeURIComponent(s.name)}`)
                  }
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
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
