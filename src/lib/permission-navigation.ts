interface PermissionNavItem {
  permission?: string;
  anyOf?: string[];
  children?: PermissionNavItem[];
}

/** Preserve filtered children and remove empty menu groups. */
export function filterPermissionNavigation<T extends PermissionNavItem>(
  items: readonly T[],
  can: (permission: string) => boolean,
): T[] {
  return items.flatMap((item) => {
    // Containers only open menus; their children decide which actions exist.
    if (!item.children) {
      const allowed = (!item.permission && !item.anyOf?.length) ||
        (!!item.permission && can(item.permission)) || (item.anyOf ?? []).some(can);
      return allowed ? [item] : [];
    }
    const children = filterPermissionNavigation(item.children, can);
    return children.length ? [{ ...item, children }] : [];
  });
}
