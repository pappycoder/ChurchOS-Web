"use client";

import { Banknote, Receipt, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyticsGiving, formatNaira } from "@/hooks/use-analytics";
import { UpcomingEvents } from "@/components/dashboard/dashboard-widgets";

export function GivingDashboard() {
  const query = useAnalyticsGiving();
  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Giving"
          value={data ? formatNaira(data.total) : query.isLoading ? "..." : "—"}
          icon={<Banknote className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Transactions"
          value={data?.count ?? (query.isLoading ? "..." : "—")}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatsCard
          title="Average Gift"
          value={data ? formatNaira(data.average) : query.isLoading ? "..." : "—"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Recurring"
          value={data?.recurring.active ?? (query.isLoading ? "..." : "—")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : data && data.byCategory.length > 0 ? (
              <div className="space-y-3">
                {data.byCategory.map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{c.categoryName}</span>
                    <span className="font-semibold tabular-nums">{formatNaira(c.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No giving data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Donors</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : data && data.topDonors.length > 0 ? (
              <div className="space-y-3">
                {data.topDonors.map((d) => (
                  <div key={d.memberId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{d.memberName}</span>
                    <span className="font-semibold tabular-nums">{formatNaira(d.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">No top donors yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <UpcomingEvents />
    </div>
  );
}
