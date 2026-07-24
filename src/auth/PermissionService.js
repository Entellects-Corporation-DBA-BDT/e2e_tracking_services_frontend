const ACTIONS = new Set([
  "view", "create", "edit", "delete", "export", "import", "upload",
  "download", "approve", "reject", "assign", "manage", "print", "share",
]);

export const PermissionService = {
  resource(profile, name) {
    return profile?.resources?.find((resource) => resource.resource === name) || null;
  },
  can(profile, resourceName, action = "view") {
    if (!ACTIONS.has(action)) return false;
    if (profile?.user?.super_admin) return true;
    return Boolean(this.resource(profile, resourceName)?.permissions?.[action]);
  },
  scope(profile, resourceName) {
    if (profile?.user?.super_admin) return "ALL";
    return this.resource(profile, resourceName)?.scope || "OWN";
  },
  visibleResources(profile) {
    return (profile?.resources || []).filter((resource) => resource.permissions?.view);
  },
};
