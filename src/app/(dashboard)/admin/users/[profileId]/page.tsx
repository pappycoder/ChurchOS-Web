"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useUser } from "@/hooks/use-users";
import { UserDetailSidebar } from "@/components/users/user-detail-sidebar";
import { UserDetailContent } from "@/components/users/user-detail-content";

export default function UserDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = React.use(params);
  const router = useRouter();
  const { data: user, isLoading, error } = useUser(profileId);

  if (error) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not Found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">User not found.</p>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isLoading ? "Loading..." : `${user?.firstName} ${user?.lastName}`}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
              <div className="space-y-3 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="border rounded-lg p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : user ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <UserDetailSidebar user={user} />
          </div>
          <div className="lg:col-span-2">
            <UserDetailContent user={user} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
