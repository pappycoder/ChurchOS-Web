export function featureForPath(path: string): string | undefined {
  if (/^\/analytics(?:\/|$)/.test(path)) return "analytics";
  if (/^\/assets(?:\/|$)/.test(path)) return "assets";
  if (/^\/(?:pastoral|appointments)(?:\/|$)/.test(path)) return "pastoral";
  if (/^\/forms(?:\/|$)/.test(path)) return "forms";
  if (/^\/admin\/(?:departments|cell-groups)(?:\/|$)/.test(path))
    return "groups";
  if (/^\/reports(?:\/|$)/.test(path)) return "reports";
  if (/^\/events(?:\/|$)/.test(path)) return "events";
  if (/^\/giving(?:\/|$)/.test(path)) return "giving";
}
export function featureForPermission(permission: string): string | undefined {
  const [resource] = permission.split(":");
  if (["assets", "asset_categories"].includes(resource)) return "assets";
  if (["pastoral", "appointments"].includes(resource)) return "pastoral";
  if (["departments", "cell_groups"].includes(resource)) return "groups";
  if (["giving", "events", "forms", "reports", "analytics"].includes(resource))
    return resource;
}
