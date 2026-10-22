import { isPublicHelpPath } from "@/lib/help/paths";

/** Public pages stay usable while session restoration or expiry completes. */
export function isPublicContentPath(path: string) {
  return /^\/accept-invitation\/?$/.test(path) || isPublicHelpPath(path) || /^\/forms\/public\/[^/]+\/?$/.test(path);
}
