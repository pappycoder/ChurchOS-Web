"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clipboard,
  FileAudio,
  FileText,
  FileVideo,
  Film,
  Folder,
  Image as ImageIcon,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { SearchInput } from "@/components/shared/search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MEDIA_PERMISSION_LABELS,
  MEDIA_PERMISSION_TEXT,
  classifyMime,
  formatBytes,
  mimePrefixForKind,
  useDeleteMediaAsset,
  useMediaFolders,
  useMediaLibrary,
  useUpdateMediaPermissions,
  type ListMediaParams,
  type MediaAsset,
  type MediaSortBy,
} from "@/hooks/use-media";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const KIND_FILTERS: { value: "all" | "image" | "audio" | "video" | "document"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "document", label: "Documents" },
];

const SORT_OPTIONS: { value: MediaSortBy; label: string }[] = [
  { value: "created_at", label: "Date Added" },
  { value: "filename", label: "Name" },
  { value: "size_bytes", label: "Size" },
];

const PERMISSION_FILTERS: { value: "" | MediaAsset["permissions"]; label: string }[] = [
  { value: "", label: "All permissions" },
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "leadership", label: "Leadership" },
];

function KindIcon({ kind, className }: { kind: "image" | "audio" | "video" | "document"; className?: string }) {
  switch (kind) {
    case "image":
      return <ImageIcon className={className} />;
    case "audio":
      return <FileAudio className={className} />;
    case "video":
      return <FileVideo className={className} />;
    default:
      return <FileText className={className} />;
  }
}

function MediaCard({
  asset,
  canUpdate,
  canDelete,
  onPreview,
  onPermissions,
  onDelete,
}: {
  asset: MediaAsset;
  canUpdate: boolean;
  canDelete: boolean;
  onPreview: (asset: MediaAsset) => void;
  onPermissions: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
}) {
  const kind = classifyMime(asset.mimeType);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(asset.url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL", {
        description: "Copy it manually from the file details.",
      });
    }
  };

  return (
    <div className="group relative rounded-lg border bg-card p-3">
<button
          type="button"
          onClick={() => onPreview(asset)}
          className="relative aspect-video w-full overflow-hidden rounded-md bg-muted"
        >
        {kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.url}
            alt={asset.filename}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <KindIcon kind={kind} className="h-10 w-10" />
          </div>
        )}
      </button>

      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-full bg-background/90 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyUrl}>
              <Clipboard className="mr-2 h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            {canUpdate && (
              <DropdownMenuItem onClick={() => onPermissions(asset)}>
                <Lock className="mr-2 h-4 w-4" />
                Change Permissions
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(asset)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 truncate pr-6 text-sm font-medium">{asset.filename}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {formatBytes(asset.sizeBytes)} · {format(new Date(asset.createdAt), "MMM d, yyyy")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="gap-1">
          <Folder className="h-3 w-3" />
          {asset.folder}
        </Badge>
        <Badge variant="outline" className={cn(MEDIA_PERMISSION_TEXT[asset.permissions])}>
          {MEDIA_PERMISSION_LABELS[asset.permissions]}
        </Badge>
      </div>
    </div>
  );
}

function MediaLibraryContent() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("media", "create");
  const canUpdate = can("media", "update");
  const canDelete = can("media", "delete");
  const canManage = canUpdate || canDelete;

  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [folder, setFolder] = React.useState(searchParams.get("folder") ?? "");
  const [kind, setKind] = React.useState<(typeof KIND_FILTERS)[number]["value"]>("all");
  const [permissions, setPermissions] = React.useState<MediaAsset["permissions"] | "">("");
  const [sortBy, setSortBy] = React.useState<MediaSortBy>("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);
  const [preview, setPreview] = React.useState<MediaAsset | null>(null);
  const [permissionsTarget, setPermissionsTarget] = React.useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaAsset | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams: ListMediaParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      folder: folder || undefined,
      mimeType: mimePrefixForKind(kind),
      permissions: permissions || undefined,
      search: search || undefined,
      sortBy,
      sortOrder,
    }),
    [page, perPage, folder, kind, permissions, search, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useMediaLibrary(queryParams);
  const foldersQuery = useMediaFolders();
  const totalsQuery = useMediaLibrary({ limit: 1 });
  const deleteMutation = useDeleteMediaAsset();
  const permissionsMutation = useUpdateMediaPermissions();

  const assets = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const folders = foldersQuery.data ?? [];

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.assetId);
      toast.success(`${deleteTarget.filename} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete file", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setDeleteTarget(null);
    }
  };

  const handlePermissionsSave = async () => {
    if (!permissionsTarget) return;
    try {
      await permissionsMutation.mutateAsync({
        assetId: permissionsTarget.assetId,
        permissions: permissionsTarget.permissions,
      });
      toast.success(
        `Permissions updated to ${MEDIA_PERMISSION_LABELS[permissionsTarget.permissions]}`
      );
      setPermissionsTarget(null);
    } catch (err) {
      toast.error("Failed to update permissions", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Media Library"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media" }]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load media library.</p>
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
        title="Media Library"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media", href: "/media" }, { label: "Library" }]}
        action={
          canCreate && (
            <Button onClick={() => router.push("/media/upload")}>
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Total Files"
          value={totalsQuery.data?.total ?? 0}
          icon={<Film className="h-4 w-4" />}
        />
        <StatsCard
          title="Folders"
          value={folders.length}
          icon={<Folder className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 items-center gap-1 rounded-md border border-input bg-background p-1">
              {KIND_FILTERS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => {
                    setKind(k.value);
                    setPage(1);
                  }}
                  className={cn(
                    "h-6 rounded px-2.5 text-sm",
                    kind === k.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <select
              value={folder}
              onChange={(e) => {
                setFolder(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={permissions}
              onChange={(e) => {
                setPermissions(e.target.value as MediaAsset["permissions"] | "");
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {PERMISSION_FILTERS.map((p) => (
                <option key={p.value || "all"} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput
              value={searchInput}
              onChange={(v) => setSearchInput(v)}
              placeholder="Search files..."
              className="w-full sm:w-64"
            />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as MediaSortBy);
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="h-8 px-2" onClick={toggleSortOrder}>
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-video w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={kind === "all" ? <Film className="h-12 w-12" /> : <KindIcon kind={kind} className="h-12 w-12" />}
                title="No files found"
                description={
                  search || folder || kind !== "all" || permissions
                    ? "Try adjusting your filters."
                    : "Upload your first file to get started."
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <MediaCard
                  key={`${asset.assetId}-${asset.url}`}
                  asset={asset}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onPreview={setPreview}
                  onPermissions={setPermissionsTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        page={page}
        perPage={perPage}
        total={total}
        itemName="files"
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />

      {canManage && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Some actions require the media:update or media:delete permission.
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-12">{preview?.filename}</DialogTitle>
            <DialogDescription>
              {preview && (
                <>
                  {formatBytes(preview.sizeBytes)}
                  {" · "}
                  <Badge variant="secondary" className="align-middle">
                    <Folder className="mr-1 h-3 w-3" />
                    {preview.folder}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {preview && classifyMime(preview.mimeType) === "image" ? (
            <div className="overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.filename}
                className="mx-auto max-h-[60vh] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-md border bg-muted py-10 text-sm text-muted-foreground">
              <Clipboard className="h-4 w-4" />
              Preview not available for this file type.
            </div>
          )}
          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!preview) return;
                void navigator.clipboard
                  .writeText(preview.url)
                  .then(() => toast.success("URL copied to clipboard"))
                  .catch(() =>
                    toast.error("Could not copy URL", {
                      description: "Copy it manually from the file details.",
                    })
                  );
              }}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            {preview && canUpdate && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => window.open(preview.url, "_blank")}>
                  Open Original
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!permissionsTarget}
        onOpenChange={(open) => !open && setPermissionsTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Permissions</DialogTitle>
            <DialogDescription>
              Who can access{" "}
              <span className="font-medium text-foreground">
                {permissionsTarget?.filename}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          {permissionsTarget && (
            <div className="space-y-2">
              {PERMISSION_FILTERS.filter((p) => p.value !== "").map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    setPermissionsTarget({
                      ...permissionsTarget,
                      permissions: p.value as MediaAsset["permissions"],
                    })
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm",
                    permissionsTarget.permissions === p.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{p.label}</span>
                  <Badge variant="outline" className={cn(MEDIA_PERMISSION_TEXT[p.value as MediaAsset["permissions"]])}>
                    {p.value === "public"
                      ? "Anyone"
                      : p.value === "members"
                        ? "All members"
                        : "Leaders only"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setPermissionsTarget(null)} disabled={permissionsMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => void handlePermissionsSave()}
              disabled={permissionsMutation.isPending}
            >
              {permissionsMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete File</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.filename}</span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MediaLibraryPage() {
  return (
    <Suspense fallback={null}>
      <MediaLibraryContent />
    </Suspense>
  );
}