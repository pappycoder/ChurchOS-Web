/** Public article routes must remain readable without a ChurchOS session. */
export function isPublicHelpPath(path: string) {
  return path === "/help" || path.startsWith("/help/");
}
