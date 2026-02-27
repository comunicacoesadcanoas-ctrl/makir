import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export function DefaultRedirect() {
  const { getDefaultRoute } = usePermissions();
  return <Navigate to={getDefaultRoute()} replace />;
}
