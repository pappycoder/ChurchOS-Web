"use client";
import { useUrlQueryState } from "@/hooks/use-url-query-state";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { ContentImage } from "@/components/shared/content-image";
import { MediaPlayback } from "@/components/shared/media-playback";
import { mediaPlaybackUrl } from "@/lib/media-playback";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { getToastErrorMessage, toast } from "@/lib/toast";
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
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  MediaHeader as PageHeader,
  mediaWorkspaceClass,
  MediaMoreFilters,
  mediaKindTones,
} from "@/components/media/media-presentation";
import { EmptyState } from "@/components/shared/empty-state";
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
  formatDate,
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
import { reportQueryError } from "@/lib/report-query-error";
import { cn } from "@/lib/utils";
import { BranchFilter } from "@/components/shared/branch-filter";

const KIND_FILTERS: {
  value: "all" | "image" | "audio" | "video" | "document";
  label: string;
}[] = [
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

const PERMISSION_FILTERS: {
  value: "" | MediaAsset["permissions"];
  label: string;
}[] = [
  { value: "", label: "All permissions" },
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "leadership", label: "Leadership" },
];

function KindIcon({
  kind,
  className,
}: {
  kind: "image" | "audio" | "video" | "document";
  className?: string;
}) {
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
  returnFocusRef,
}: {
  asset: MediaAsset;
  canUpdate: boolean;
  canDelete: boolean;
  onPreview: (asset: MediaAsset) => void;
  onPermissions: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const kind = classifyMime(asset.mimeType);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(
          mediaPlaybackUrl(asset.url) ?? asset.url,
          window.location.origin,
        ).href,
      );
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL", {
        description: "Copy it manually from the file details.",
      });
    }
  };

  return (
    <div className="group relative min-w-0 rounded-xl border bg-card p-2.5">
      <button
        type="button"
        onClick={(event) => {
          returnFocusRef.current = event.currentTarget;
          onPreview(asset);
        }}
        aria-label={`Preview ${asset.filename}`}
        className={cn(
          "relative aspect-[16/9] w-full overflow-hidden rounded-lg",
          mediaKindTones[kind],
        )}
      >
        {kind === "image" ? (
          <ContentImage
            src={asset.url}
            alt={asset.filename}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <KindIcon kind={kind} className="h-8 w-8" />
          </div>
        )}
      </button>

      <div className="absolute right-3 top-3">
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) returnFocusRef.current = menuRef.current;
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              ref={menuRef}
              aria-label={`Manage ${asset.filename}`}
              variant="secondary"
              size="icon"
              className="size-10 rounded-lg border bg-background/95 shadow-xs"
            >
              <MoreVertical className="h-4 w-4" />
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

      <div
        title={asset.filename}
        className="mt-2 line-clamp-2 break-words text-xs font-semibold"
      >
        {asset.filename}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 h-8 text-xs"
        onClick={(event) => {
          returnFocusRef.current = event.currentTarget;
          onPreview(asset);
        }}
      >
        {kind === "audio"
          ? "Play Audio"
          : kind === "video"
            ? "Watch Video"
            : "View File"}
      </Button>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {formatBytes(asset.sizeBytes)} · {formatDate(asset.createdAt)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="max-w-full gap-1 text-[10px] font-normal"
        >
          <Folder className="h-3 w-3" />
          <span className="truncate">{asset.folder}</span>
        </Badge>
        <Badge
          variant="outline"
          className={cn(MEDIA_PERMISSION_TEXT[asset.permissions])}
        >
          {MEDIA_PERMISSION_LABELS[asset.permissions]}
        </Badge>
      </div>
    </div>
  );
}

function MediaLibraryContent() {
  const router = useRouter();
  const { can } = usePermissions();
  const canReadRestricted = can("media:restricted", "read");
  const canCreate = can("media:upload", "create");
  const canUpdate = can("media:library", "update");
  const canDelete = can("media:library", "delete");
  const canManage = canUpdate || canDelete;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [folder, setFolder] = useUrlQueryState("folder");
  const [kind, setKind] =
    React.useState<(typeof KIND_FILTERS)[number]["value"]>("all");
  const [permissions, setPermissions] = React.useState<
    MediaAsset["permissions"] | ""
  >("");
  const [sortBy, setSortBy] = React.useState<MediaSortBy>("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);
  const [branchId, setBranchId] = React.useState("");
  const [preview, setPreview] = React.useState<MediaAsset | null>(null);
  const [permissionsTarget, setPermissionsTarget] =
    React.useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaAsset | null>(
    null,
  );
  const [retrying, setRetrying] = React.useState(false);

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
      branchId: branchId || undefined,
    }),
    [
      page,
      perPage,
      folder,
      kind,
      permissions,
      search,
      sortBy,
      sortOrder,
      branchId,
    ],
  );

  const { data, isLoading, error, refetch } = useMediaLibrary(queryParams);
  const foldersQuery = useMediaFolders();
  const returnFocusRef = React.useRef<HTMLButtonElement | null>(null);
  const deleteMutation = useDeleteMediaAsset();
  const permissionsMutation = useUpdateMediaPermissions();

  // The inline error state below never reaches the dashboard error boundary,
  // so report failed fetches here — otherwise this page fails silently in Sentry.
  React.useEffect(() => {
    if (error) reportQueryError(error, "media-library");
  }, [error]);

  const assets = React.useMemo(() => {
    const list = data?.data ?? [];
    // Mirror the API restriction when rendering cached assets.
    return canReadRestricted
      ? list
      : list.filter((a) => a.permissions !== "leadership");
  }, [data, canReadRestricted]);
  const total = data?.total ?? 0;
  const folders = Array.isArray(foldersQuery.data) ? foldersQuery.data : [];

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
        description: getToastErrorMessage(err, "Please try again."),
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
        `Permissions updated to ${MEDIA_PERMISSION_LABELS[permissionsTarget.permissions]}`,
      );
      setPermissionsTarget(null);
    } catch (err) {
      toast.error("Failed to update permissions", {
        description: getToastErrorMessage(err, "Please try again."),
      });
    }
  };

  // Retry refetches the queries directly instead of reloading the whole
  // document: a reload re-enters the service-worker cache path, which is
  // what made the error stick until a hard refresh.
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await Promise.all([refetch(), foldersQuery.refetch()]);
    } finally {
      setRetrying(false);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Media Library"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Media" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load media library.</p>
          <Button
            variant="outline"
            onClick={() => void handleRetry()}
            disabled={retrying}
          >
            {retrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${mediaWorkspaceClass} space-y-4`}>
      <PageHeader
        count={isLoading ? undefined : total}
        title="Media Library"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Media", href: "/media" },
          { label: "Library" },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canCreate && (
              <Button
                onClick={() => {
                  if (confirmDiscardChanges()) router.push("/media/upload");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search files..."
              className="w-full sm:w-64"
            />
            <BranchFilter
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
            />
            {foldersQuery.isError && (
              <span className="text-xs text-destructive">
                Folders unavailable{" "}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void foldersQuery.refetch()}
                >
                  Retry folders
                </Button>
              </span>
            )}
            <select
              aria-label="Folder"
              value={folder}
              onChange={(event) => {
                setFolder(event.target.value);
                setPage(1);
              }}
              className="h-9 max-w-full rounded-lg border bg-background px-2 text-sm"
            >
              <option value="">All folders</option>
              {folders.map((item) => (
                <option key={item.folder} value={item.folder}>
                  {item.folder}
                </option>
              ))}
            </select>
            <MediaMoreFilters
              count={
                Number(permissions !== "") +
                Number(sortBy !== "created_at") +
                Number(sortOrder !== "desc")
              }
            >
              <select
                aria-label="Access filter"
                value={permissions}
                onChange={(event) => {
                  setPermissions(
                    event.target.value as MediaAsset["permissions"] | "",
                  );
                  setPage(1);
                }}
                className="h-9 rounded-lg border bg-background px-2 text-sm"
              >
                {PERMISSION_FILTERS.filter(
                  (item) => item.value !== "leadership" || canReadRestricted,
                ).map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Sort files"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as MediaSortBy);
                  setPage(1);
                }}
                className="h-9 rounded-lg border bg-background px-2 text-sm"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    Sort: {item.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={toggleSortOrder}>
                {sortOrder === "asc" ? "Asc" : "Desc"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setFolder("");
                  setKind("all");
                  setPermissions("");
                  setBranchId("");
                  setSortBy("created_at");
                  setSortOrder("desc");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </MediaMoreFilters>
          </div>
          <div
            role="group"
            aria-label="File type"
            className="flex flex-wrap gap-1.5"
          >
            {KIND_FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={kind === item.value ? "default" : "ghost"}
                size="sm"
                aria-pressed={kind === item.value}
                onClick={() => {
                  setKind(item.value);
                  setPage(1);
                }}
              >
                {item.label}
              </Button>
            ))}
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
                icon={
                  kind === "all" ? (
                    <Film className="h-12 w-12" />
                  ) : (
                    <KindIcon kind={kind} className="h-12 w-12" />
                  )
                }
                title="No files found"
                description={
                  search || folder || kind !== "all" || permissions
                    ? "Try adjusting your filters."
                    : "Upload your first file to get started."
                }
              />
            </div>
          ) : (
            <div
              data-export-list
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {assets.map((asset) => (
                <MediaCard
                  key={`${asset.assetId}-${asset.url}`}
                  asset={asset}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onPreview={setPreview}
                  onPermissions={setPermissionsTarget}
                  onDelete={setDeleteTarget}
                  returnFocusRef={returnFocusRef}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        pageSizeOptions={[10, 12, 15, 25, 50]}
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

      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent
          className={`${mediaWorkspaceClass} max-h-[90dvh] overflow-y-auto sm:max-w-3xl`}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => returnFocusRef.current?.focus());
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="truncate pr-12">
              {preview?.filename}
            </DialogTitle>
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
              <ContentImage
                src={preview.url}
                alt={preview.filename}
                className="mx-auto max-h-[60vh] w-full object-contain"
              />
            </div>
          ) : preview &&
            ["audio", "video"].includes(classifyMime(preview.mimeType)) ? (
            <MediaPlayback
              src={preview.url}
              kind={classifyMime(preview.mimeType) as "audio" | "video"}
              title={preview.filename}
            />
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
                  .writeText(
                    new URL(
                      mediaPlaybackUrl(preview.url) ?? preview.url,
                      window.location.origin,
                    ).href,
                  )
                  .then(() => toast.success("URL copied to clipboard"))
                  .catch(() =>
                    toast.error("Could not copy URL", {
                      description: "Copy it manually from the file details.",
                    }),
                  );
              }}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            {preview && (
              <div className="flex items-center gap-2">
                {mediaPlaybackUrl(preview.url) && (
                  <Button variant="outline" asChild>
                    <a
                      href={mediaPlaybackUrl(preview.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Original
                    </a>
                  </Button>
                )}
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
        <DialogContent
          className={`${mediaWorkspaceClass} sm:max-w-[420px]`}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => returnFocusRef.current?.focus());
            }
          }}
        >
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
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span className="font-medium">{p.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      MEDIA_PERMISSION_TEXT[
                        p.value as MediaAsset["permissions"]
                      ],
                    )}
                  >
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
            <Button
              variant="outline"
              onClick={() => setPermissionsTarget(null)}
              disabled={permissionsMutation.isPending}
            >
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          className={`${mediaWorkspaceClass} sm:max-w-[420px]`}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef.current?.isConnected) {
              event.preventDefault();
              requestAnimationFrame(() => returnFocusRef.current?.focus());
            }
          }}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete File</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.filename}
              </span>
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
