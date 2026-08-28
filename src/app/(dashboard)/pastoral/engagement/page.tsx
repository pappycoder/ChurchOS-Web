"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Sparkles,
} from "lucide-react";
import {
  useEngagementScores,
  useEngagementDistribution,
  type EngagementBucket,
  type EngagementScore,
  ENGAGEMENT_BUCKET_LABELS,
  ENGAGEMENT_BUCKET_TEXT,
  engagementBucketFor,
} from "@/hooks/use-pastoral";
import { PageHeader } from "@/components/shared/page-header";
import { TableCard } from "@/components/shared/table-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { StatsCard } from "@/components/shared/stats-card";
import { MemberScoringDialog } from "@/components/pastoral/member-scoring-dialog";
import { cn } from "@/lib/utils";

const BUCKET_ORDER: EngagementBucket[] = [
  "highly_engaged",
  "moderately_engaged",
  "low_engagement",
  "disengaged",
];

const BUCKET_CARD_VARIANT: Record<EngagementBucket, "default" | "primary" | "success" | "warning"> = {
  highly_engaged: "success",
  moderately_engaged: "primary",
  low_engagement: "warning",
  disengaged: "default",
};

const SORT_OPTIONS = [
  { value: "score", label: "Engagement Score" },
  { value: "calculated_at", label: "Date Calculated" },
];

export default function EngagementPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [bucketFilter, setBucketFilter] = React.useState<EngagementBucket | "all">(
    "all"
  );
  const [sortBy, setSortBy] = React.useState<"score" | "calculated_at">("score");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Debounce server-side search.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      search: search || undefined,
      bucket: bucketFilter === "all" ? undefined : bucketFilter,
      sortBy,
      sortOrder,
    }),
    [page, perPage, search, bucketFilter, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useEngagementScores(queryParams);
  const distributionQuery = useEngagementDistribution();

  const scores = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;
  const distribution = distributionQuery.data;

  const [selected, setSelected] = React.useState<EngagementScore | null>(null);

  if (error) {
    return (
      <div>
        <PageHeader
          title="Engagement"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Pastoral Care" },
            { label: "Engagement" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load engagement scores.</p>
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
        title="Engagement"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Pastoral Care" },
          { label: "Engagement" },
        ]}
      />

      {/* Distribution overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BUCKET_ORDER.map((bucket) => {
          const count = distribution?.[bucket] ?? 0;
          return (
            <StatsCard
              key={bucket}
              title={ENGAGEMENT_BUCKET_LABELS[bucket]}
              value={count}
              icon={<Sparkles className="h-4 w-4" />}
              variant={BUCKET_CARD_VARIANT[bucket]}
              subtitle={
                distributionQuery.isLoading
                  ? "Loading..."
                  : count === 1
                    ? "1 member"
                    : `${count} members`
              }
            />
          );
        })}
      </div>

      <TableCard
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search by member name..."
                className="w-full sm:w-64"
              />
              <Select
                value={bucketFilter}
                onValueChange={(v) => {
                  setBucketFilter(v as EngagementBucket | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Buckets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buckets</SelectItem>
                  {BUCKET_ORDER.map((bucket) => (
                    <SelectItem key={bucket} value={bucket}>
                      {ENGAGEMENT_BUCKET_LABELS[bucket]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v as "score" | "calculated_at");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <ArrowUpDown className="h-4 w-4 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        }
        itemName="members"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
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
        ) : scores.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Sparkles className="h-12 w-12" />}
              title="No engagement scores yet"
              description={
                search || bucketFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Engagement scores appear once attendance and giving are being recorded."
              }
            />
          </div>
        ) : (
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Calculated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((row) => {
                    const bucket = engagementBucketFor(row.score);
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(row)}
                      >
                        <TableCell>
                          <p className="font-medium">
                            {row.memberFirstName} {row.memberLastName}
                          </p>
                          {row.memberEmail && (
                            <p className="text-xs text-muted-foreground truncate">
                              {row.memberEmail}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-semibold">
                            {Math.round(row.score)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              ENGAGEMENT_BUCKET_TEXT[bucket]
                            )}
                          >
                            {ENGAGEMENT_BUCKET_LABELS[bucket]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(row.calculatedAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          )}
      </TableCard>

      <MemberScoringDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        memberId={selected?.memberId}
        memberName={
          selected
            ? `${selected.memberFirstName} ${selected.memberLastName}`
            : ""
        }
      />
    </div>
  );
}