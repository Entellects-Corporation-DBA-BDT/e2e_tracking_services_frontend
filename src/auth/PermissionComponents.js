import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "./PermissionContext";

export function ProtectedRoute({ resource, children }) {
  const { can, loading } = usePermissions();
  const location = useLocation();
  if (loading) return null;
  return can(resource, "view")
    ? children
    : <Navigate to="/forbidden" replace state={{ from: location }} />;
}

export function ProtectedMenu({ resource, children }) {
  return usePermissions().can(resource, "view") ? children : null;
}

export function ProtectedButton({ resource, action, children }) {
  return usePermissions().can(resource, action) ? children : null;
}

export function ProtectedAction(props) {
  return <ProtectedButton {...props} />;
}

export function ProtectedTable({ resource, children }) {
  return usePermissions().can(resource, "view") ? children : null;
}
