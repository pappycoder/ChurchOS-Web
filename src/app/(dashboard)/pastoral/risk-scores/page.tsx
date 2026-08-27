"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpDown,
  Activity,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useRiskScores,
  useRecalculateScores,
  type RiskLevel,
  type RiskScore,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_TEXT,
} from "@/hooks/use-pastoral";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { TablePagination } from "@/components/shared/table-pagination";
import { MemberScoringDialog } from "@/components/pastoral/member-scoring-dialog";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS: Array<{ value: RiskLevel; label: string }> = [
  { value: "critical", label: RISK_LEVEL_LABELS.critical },
  { value: "high", label: RISK_LEVEL_LABELS.high },
  { value: "medium", label: RISK_LEVEL_LABELS.medium },
  { value: "low", label: RISK_LEVEL_LABELS.low },
];

const SORT_OPTIONS = [
  { value: "score", label: "Risk Score" },
  { value: "calculated_at", label: "Date Calculated" },
];

export default function RiskScoresPage() {
  const { can } = usePermissions();
  const canRecalculate = can("pastoral", "update");

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<RiskLevel | "all">("all");
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
      level: levelFilter === "all" ? undefined : levelFilter,
      sortBy,
      sortOrder,
    }),
    [page, perPage, search, levelFilter, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useRiskScores(queryParams);
  const recalculateMutation = useRecalculateScores();

  const scores = React.useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const [selected, setSelected] = React.useState<RiskScore | null>(null);

  const handleRecalculate = () => {
    recalculateMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast.success("Scores recalculated", {
          description: `${res.engagementScored} members scored for engagement, ${res.riskScored} for risk.`,
        });
      },
      onError: (error) => {
        toast.error("Failed to recalculate scores", {
          description: error?.message || "Please try again.",
        });
      },
    });
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Risk Scores"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Pastoral Care" },
            { label: "Risk Scores" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load risk scores.</p>
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
        title="Risk Scores"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Pastoral Care" },
          { label: "Risk Scores" },
        ]}
        action={
          canRecalculate && (
            <Button
              onClick={handleRecalculate}
              disabled={recalculateMutation.isPending}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-2",
                  recalculateMutation.isPending && "animate-spin"
                )}
              />
              {recalculateMutation.isPending ? "Calculating..." : "Recalculate Scores"}
            </Button>
          )
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by member name..."
              className="w-full sm:w-64"
            />
            <Select
              value={levelFilter}
              onValueChange={(v) => {
                setLevelFilter(v as RiskLevel | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              <SelectTrigger className="w-40">
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
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="No risk scores yet"
                description={
                  search || levelFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : canRecalculate
                      ? "Run \"Recalculate Scores\" to flag members at risk of disengagement."
                      : "Risk scores have not been calculated yet."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Calculated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((row) => (
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
                            RISK_LEVEL_TEXT[row.level]
                          )}
                        >
                          {RISK_LEVEL_LABELS[row.level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(row.calculatedAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        itemName="members"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

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