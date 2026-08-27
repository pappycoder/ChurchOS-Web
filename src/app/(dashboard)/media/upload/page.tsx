"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Folder,
  FolderPlus,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MEDIA_UPLOAD_LIMITS,
  formatBytes,
  useMediaFolders,
  useUploadMediaFile,
  type UploadMediaResponse,
} from "@/hooks/use-media";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

type QueueStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  result?: UploadMediaResponse;
  error?: string;
}

let queueSeq = 0;

function validateFile(file: File): string | null {
  const limit = file.type.startsWith("image/")
    ? MEDIA_UPLOAD_LIMITS.imageBytes
    : MEDIA_UPLOAD_LIMITS.fileBytes;
  if (file.size > limit) {
    const kind = file.type.startsWith("image/") ? "Images" : "Files";
    return `${file.name}: ${kind} must be ${formatBytes(limit)} or smaller.`;
  }
  return null;
}

function MediaUploadPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const canCreate = can("media", "create");

  const foldersQuery = useMediaFolders();
  const folders = foldersQuery.data ?? [];
  const uploadMutation = useUploadMediaFile();

  const [folder, setFolder] = React.useState("uploads");
  const [newFolderMode, setNewFolderMode] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [queue, setQueue] = React.useState<QueueItem[]>([]);
  const [uploaded, setUploaded] = React.useState<QueueItem[]>([]);
  const [uploadingAll, setUploadingAll] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const effectiveFolder = newFolderMode ? newFolderName.trim() || "uploads" : folder;

  const addFiles = React.useCallback(
    (files: FileList | File[]) => {
      const next: QueueItem[] = [];
      for (const file of Array.from(files)) {
        const err = validateFile(file);
        if (err) {
          toast.error(err);
          continue;
        }
        next.push({ id: `q-${++queueSeq}`, file, status: "pending" });
      }
      if (next.length) {
        setQueue((prev) => [...prev, ...next]);
        toast.info(`${next.length} file${next.length > 1 ? "s" : ""} added`);
      }
    },
    []
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const uploadAll = async () => {
    const target = effectiveFolder;
    setUploadingAll(true);
    for (const item of queue.filter((q) => q.status !== "done")) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", error: undefined } : q)));
      try {
        const result = await uploadMutation.mutateAsync({ file: item.file, folder: target });
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "done", result } : q
          )
        );
        setUploaded((prev) => [...prev, { ...item, status: "done", result }]);
        toast.success(`${item.file.name} uploaded`);
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : q
          )
        );
      }
    }
    setUploadingAll(false);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  if (!canCreate) {
    return (
      <div>
        <PageHeader
          title="Media Upload"
          breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media", href: "/media" }, { label: "Upload" }]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-muted-foreground">
            You do not have permission to upload media files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media Upload"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Media", href: "/media" }, { label: "Upload" }]}
        action={
          <Button variant="outline" onClick={() => router.push("/media")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Choose where files should be stored, then pick or drag files in. Images are
            optimized automatically (up to 5 MB); other files up to 50 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Folder</Label>
            {newFolderMode ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewFolderMode(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex max-w-xs items-center gap-2">
                <select
                  value={folder}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setNewFolderMode(true);
                    } else {
                      setFolder(e.target.value);
                    }
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="uploads">uploads</option>
                  {folders
                    .filter((f) => f !== "uploads")
                    .map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  <option value="__new__">+ New folder…</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setNewFolderMode(true)}
                  aria-label="New folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">
              Drop files here, or <span className="text-primary">browse</span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Images auto-optimized to WebP · non-images kept as-is
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {queue.filter((q) => q.status !== "done").length} file
                  {queue.filter((q) => q.status !== "done").length !== 1 ? "s" : ""} waiting
                </p>
                <Button
                  type="button"
                  onClick={() => void uploadAll()}
                  disabled={uploadingAll || queue.every((q) => q.status === "done")}
                >
                  {uploadingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploadingAll ? "Uploading..." : "Upload All"}
                </Button>
              </div>
              <div className="space-y-2 rounded-md border p-3">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        item.status === "done"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : item.status === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                      )}
                    >
                      {item.status === "done" ? (
                        <Check className="h-4 w-4" />
                      ) : item.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(item.file.size)} ·{" "}
                        {item.status === "done"
                          ? `uploaded to ${item.result?.path ?? effectiveFolder}`
                          : item.status === "error"
                            ? item.error
                            : item.status === "uploading"
                              ? "Uploading..."
                              : "Waiting"}
                      </p>
                    </div>
                    {item.status === "done" && item.result && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => copyUrl(item.result!.url)}>
                        <Clipboard className="mr-2 h-3.5 w-3.5" />
                        Copy URL
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploaded.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/media")}>
                View in Library
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQueue([]);
                  setUploaded([]);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MediaUploadPage;