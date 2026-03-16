import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const { canViewRoute } = usePermissions();
  const location = useLocation();

  // 1. Still checking auth — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Not authenticated — redirect to login (preserve intended destination)
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Authenticated but profile not loaded yet — show spinner
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 4. Route permission check
  const currentPath = location.pathname;
  const isDynamicRoute =
    currentPath.startsWith("/app/distrito/") ||
    currentPath.startsWith("/app/congregacao/");

  if (currentPath !== "/app" && !isDynamicRoute && !canViewRoute(currentPath)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
