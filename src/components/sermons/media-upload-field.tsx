"use client";

import * as React from "react";
import { toast } from "sonner";
import { Upload, Link, X, FileAudio, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";

interface MediaUploadFieldProps {
  label: string;
  accept: string;
  /** "audio" or "video" — used when pasting a URL to tag the type */
  mediaType: "audio" | "video";
  value?: string;
  onChange: (url: string | undefined) => void;
}

type Mode = "upload" | "url";

export function MediaUploadField({
  label,
  accept,
  mediaType,
  value,
  onChange,
}: MediaUploadFieldProps) {
  const [mode, setMode] = React.useState<Mode>("upload");
  const [urlInput, setUrlInput] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const { can } = usePermissions();
  const canUpload = can("media", "create");
  const effectiveMode: Mode = canUpload ? mode : "url";
  const Icon = mediaType === "audio" ? FileAudio : FileVideo;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "sermons");

      // Simulate progress (real XHR progress isn't available with fetch)
      const progressTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const res = await api.post<{ url: string }>("/media/upload", formData);

      clearInterval(progressTimer);
      setProgress(100);
      onChange(res.url);
      setSelectedFile(null);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(`Failed to upload ${label.toLowerCase()}`, {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput("");
    toast.success(`${label} link saved`);
  };

  const handleRemove = () => {
    onChange(undefined);
    setSelectedFile(null);
    setUrlInput("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // If a value is already set, show it with a remove button
  if (value) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemove}
            aria-label="Remove media"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-md border p-0.5 w-fit">
        {canUpload && (
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              effectiveMode === "upload"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMode("upload")}
          >
            <Upload className="h-3 w-3" />
            Upload File
          </button>
        )}
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            effectiveMode === "url"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setMode("url")}
        >
          <Link className="h-3 w-3" />
          Paste Link
        </button>
      </div>

      {effectiveMode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatSize(selectedFile.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Remove selected media"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {uploading && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-3 w-3" />
                )}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-3 w-3" />
              Choose {mediaType === "audio" ? "Audio" : "Video"} File
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder={
              mediaType === "audio"
                ? "https://soundcloud.com/..."
                : "https://youtube.com/watch?v=..."
            }
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            <Link className="mr-2 h-3 w-3" />
            Save Link
          </Button>
        </div>
      )}
    </div>
  );
}
