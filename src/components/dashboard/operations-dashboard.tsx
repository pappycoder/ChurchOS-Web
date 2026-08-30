"use client";

import { CalendarCheck, HandCoins, Users } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMembersList } from "@/hooks/use-members";
import { useAttendanceRecords } from "@/hooks/use-attendance";
import { useGivingTransactions } from "@/hooks/use-giving";
import { UpcomingEvents, RecentGiving } from "@/components/dashboard/dashboard-widgets";

export function OperationsDashboard() {
  const members = useMembersList({ page: 1, limit: 1 });
  const attendance = useAttendanceRecords({ page: 1, limit: 5, sortBy: "checkinAt", sortOrder: "desc" });
  const giving = useGivingTransactions({ page: 1, limit: 1 });

  const memberTotal = members.data?.meta?.total;
  const givingTotal = giving.data?.meta?.total;
  const attendanceLoading = attendance.isLoading;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={memberTotal ?? (members.isLoading ? "..." : "—")}
          icon={<Users className="h-4 w-4" />}
          variant="primary"
        />
        <StatsCard
          title="Attendance Recorded"
          value={attendance.data?.meta?.total ?? (attendanceLoading ? "..." : "—")}
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Giving Transactions"
          value={givingTotal ?? (giving.isLoading ? "..." : "—")}
          icon={<HandCoins className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingEvents />
        <RecentGiving />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : attendance.data && attendance.data.data.length > 0 ? (
            <ul className="divide-y">
              {attendance.data.data.map((rec) => (
                <li key={rec.attendanceId} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="truncate font-medium">
                    {rec.memberName || rec.visitorName || "Unnamed"}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {rec.serviceName}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No attendance recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
