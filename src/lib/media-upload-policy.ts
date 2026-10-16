/** Exact grants accepted by the backend for each upload purpose. */
export const MEDIA_UPLOAD_PERMISSIONS: Record<string, readonly string[]> = {
  churches: ["church_settings:update"],
  branches: ["branches:update"],
  assets: ["media:upload:create", "assets:list:create", "assets:list:update"],
  sermons: ["media:upload:create", "sermons:new:create", "sermons:update"],
  "form-attachments": ["media:upload:create", "forms:list:read"],
};

export function mediaUploadPermissions(folder: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(MEDIA_UPLOAD_PERMISSIONS, folder)
    ? MEDIA_UPLOAD_PERMISSIONS[folder]
    : ["media:upload:create"];
}
