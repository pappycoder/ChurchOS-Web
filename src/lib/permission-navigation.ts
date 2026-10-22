interface PermissionNavItem {
  href?: string;
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children?: PermissionNavItem[];
}

/** Preserve filtered children and remove empty menu groups. */
export function filterPermissionNavigation<T extends PermissionNavItem>(
  items: readonly T[],
  can: (permission: string) => boolean,
  canVisit: (path: string) => boolean = () => true,
): T[] {
  return items.flatMap((item) => {
    // Containers only open menus; their children decide which actions exist.
    if (!item.children) {
      const allowed = (!item.permission && !item.anyOf?.length) ||
        (!!item.permission && can(item.permission)) || (item.anyOf ?? []).some(can);
      return allowed && (item.allOf ?? []).every(can) && (!item.href || canVisit(item.href)) ? [item] : [];
    }
    const children = filterPermissionNavigation(item.children, can, canVisit);
    return children.length ? [{ ...item, children }] : [];
  });
}
