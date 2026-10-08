"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Folder, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
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
import {
  useMediaFolders,
  type MediaFolderSummary,
} from "@/hooks/use-media";
import { reportQueryError } from "@/lib/report-query-error";

function FolderRow({ folder }: { folder: MediaFolderSummary }) {
  const router = useRouter();

  const newest = folder.newestAt;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() =>
        router.push(`/media?folder=${encodeURIComponent(folder.folder)}`)
      }
    >
      <TableCell className="font-medium">
        <span className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          {folder.folder}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{folder.count}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {newest ? format(new Date(newest), "MMM d, yyyy") : "-"}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">View files →</TableCell>
    </TableRow>
  );
}

function MediaFoldersPage() {
  const { data: foldersData, isLoading, error, refetch } = useMediaFolders();

  // Defensive: a bad cache entry (e.g. a prefetch shape mismatch) must never
  // reach `.length`/`.slice()` below and crash to the dashboard boundary.
  const folders = React.useMemo(
    () => (Array.isArray(foldersData) ? foldersData : []),
    [foldersData]
  );

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [retrying, setRetrying] = React.useState(false);
  const pagedFolders = React.useMemo(
    () => folders.slice((page - 1) * perPage, page * perPage),
    [folders, page, perPage]
  );

  // Inline error state — never reaches the dashboard error boundary, so
  // report it here (same gap as the media library page).
  React.useEffect(() => {
    if (error) reportQueryError(error, "media-folders");
  }, [error]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await refetch();
    } finally {
      setRetrying(false);
    }
  };

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
          <Button variant="outline" onClick={() => void handleRetry()} disabled={retrying}>
            {retrying ? "Retrying..." : "Retry"}
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

      <TableCard
        title="Media Folders"
        description="Files are organized into folders. Click a folder to browse its files in the library."
        itemName="folders"
        page={page}
        perPage={perPage}
        total={folders?.length ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<FolderOpen className="h-12 w-12" />}
              title="No folders yet"
              description="Upload your first file to create a folder."
            />
          </div>
        ) : (
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
              {pagedFolders.map((folder) => (
                <FolderRow key={folder.folder} folder={folder} />
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  );
}

export default MediaFoldersPage;