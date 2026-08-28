"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Users,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSermonsSpeakers } from "@/hooks/use-sermons";

export default function SermonsSpeakersPage() {
  const router = useRouter();
  const { data: speakers, isLoading, error } = useSermonsSpeakers();

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const pagedSpeakers = React.useMemo(
    () => (speakers ?? []).slice((page - 1) * perPage, page * perPage),
    [speakers, page, perPage]
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load speakers.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Speakers"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Sermons", href: "/sermons" },
          { label: "Speakers" },
        ]}
      />

      <TableCard
        description={
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {speakers?.length ?? 0} speakers
          </div>
        }
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
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSpeakers.map((s) => (
                <TableRow key={s.name}>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/sermons?speaker=${encodeURIComponent(s.name)}`)
                      }
                    >
                      View Sermons
                    </Button>
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
