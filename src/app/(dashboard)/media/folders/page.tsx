"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Folder, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaFolders, useMediaLibrary } from "@/hooks/use-media";

function FolderRow({ name }: { name: string }) {
  const router = useRouter();
  const { data, isLoading } = useMediaLibrary({ folder: name, limit: 1 });

  const newest = data?.data?.[0]?.createdAt;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`/media?folder=${encodeURIComponent(name)}`)}
    >
      <TableCell className="font-medium">
        <span className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          {name}
        </span>
      </TableCell>
      <TableCell>
        {isLoading ? (
          <Skeleton className="h-5 w-10" />
        ) : (
          <Badge variant="secondary">{data?.total ?? 0}</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-28" />
        ) : newest ? (
          format(new Date(newest), "MMM d, yyyy")
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">View files →</TableCell>
    </TableRow>
  );
}

function MediaFoldersPage() {
  const { data: folders, isLoading, error } = useMediaFolders();

  if (error) {
    return (
      <div>
        <PageHeader
          title="Media Folders"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media", href: "/media" }, { label: "Folders" }]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load media folders.</p>
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
        title="Media Folders"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media", href: "/media" }, { label: "Folders" }]}
      />

      <Card>
        <CardHeader className="text-sm text-muted-foreground">
          Files are organized into folders. Click a folder to browse its files in the library.
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !folders || folders.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<FolderOpen className="h-12 w-12" />}
                title="No folders yet"
                description="Upload your first file to create a folder."
              />
            </div>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folder</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Newest File</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folders.map((name) => (
                    <FolderRow key={name} name={name} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MediaFoldersPage;