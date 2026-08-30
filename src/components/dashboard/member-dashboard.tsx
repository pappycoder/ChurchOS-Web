"use client";

import { BookOpen, Church, MapPin } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useSermonsList } from "@/hooks/use-sermons";
import { UpcomingEvents } from "@/components/dashboard/dashboard-widgets";

export function MemberDashboard() {
  const profile = useCurrentProfile();

  const church = profile.data?.church;
  const branch = profile.data?.branch;

  const sermons = useSermonsList({ page: 1, limit: 5, sortBy: "sermonDate", sortOrder: "desc" });
  const sermonsList = sermons.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Church className="h-4 w-4 text-muted-foreground" />
              My Church
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-semibold">{church?.name || "—"}</p>
              {church?.denomination && (
                <p className="text-sm text-muted-foreground">{church.denomination}</p>
              )}
            </div>
            {branch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {branch.name}
                {branch.isHeadquarters && (
                  <span className="text-xs text-muted-foreground">· Headquarters</span>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile.data?.firstName}! Browse events, sermons and your church
              community below.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Recent Sermons
            </CardTitle>
            <Link
              href="/sermons"
              className="text-xs text-primary hover:underline shrink-0"
            >
              All sermons
            </Link>
          </CardHeader>
          <CardContent>
            {sermons.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
            ) : sermonsList.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No sermons yet.</p>
            ) : (
              <ul className="divide-y">
                {sermonsList.map((s) => (
                  <li key={s.sermonId} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.speaker || "Church"}
                        {s.sermonDate
                          ? ` · ${new Date(s.sermonDate).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={`/sermons/${s.sermonId}`}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Listen
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <UpcomingEvents />
    </div>
  );
}
