import { api } from "@/lib/api";
import type { UploadMediaResponse } from "@/hooks/use-media";

interface UploadGrant {
  uploadUrl: string;
  ticket: string;
}
// Keep the completion ticket after a successful transfer so a retry does not send the file twice.
const completedTransfers = new WeakMap<
  File,
  { grant: UploadGrant; folder: string; branchId?: string }
>();

export async function directMediaUpload(
  file: File,
  folder: string,
  branchId?: string,
): Promise<UploadMediaResponse> {
  if (!file.size || file.size > 50 * 1024 * 1024)
    throw new Error("Choose a file no larger than 50 MB.");
  let transfer = completedTransfers.get(file);
  if (
    !transfer ||
    transfer.folder !== folder ||
    transfer.branchId !== branchId
  ) {
    const grant = await api.post<UploadGrant>("/media/upload/prepare", {
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder,
      branchId,
    });
    const url = new URL(grant.uploadUrl);
    if (
      url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")
    )
      throw new Error("Storage did not return a secure upload address.");
    let response: Response;
    try {
      response = await fetch(grant.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        credentials: "omit",
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
    } catch {
      throw new Error(
        "The upload connection was interrupted. Check your connection and retry this recording.",
      );
    }
    if (!response.ok)
      throw new Error(
        `Storage upload failed (${response.status}). Please retry this recording.`,
      );
    transfer = { grant, folder, branchId };
    completedTransfers.set(file, transfer);
  }
  try {
    const result = await api.post<UploadMediaResponse>(
      "/media/upload/complete",
      {
        ticket: transfer.grant.ticket,
      },
    );
    completedTransfers.delete(file);
    return result;
  } catch (error) {
    // An expired or revoked grant needs a fresh authorization on the next retry.
    const status = (error as { statusCode?: number } | null)?.statusCode;
    if (status === 401 || status === 403) completedTransfers.delete(file);
    throw error;
  }
}
