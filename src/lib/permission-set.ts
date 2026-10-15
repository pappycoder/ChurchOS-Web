/** Share immutable permission indexes across components using the same profile. */
const indexes = new WeakMap<readonly string[], ReadonlySet<string>>();
const emptyPermissions: ReadonlySet<string> = new Set<string>();

export function getPermissionSet(names?: readonly string[]): ReadonlySet<string> {
  if (!names?.length) return emptyPermissions;
  let index = indexes.get(names);
  if (!index) {
    index = new Set(names);
    indexes.set(names, index);
  }
  return index;
}
