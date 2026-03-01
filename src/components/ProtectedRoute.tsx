import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { lovable } from "@/integrations/lovable";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const { canViewRoute } = usePermissions();
  const location = useLocation();
  const redirecting = useRef(false);

  // Auto-trigger Google login when not authenticated (only once)
  useEffect(() => {
    if (!loading && !session && !redirecting.current) {
      redirecting.current = true;
      lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/app/dashboard",
      });
    }
  }, [loading, session]);

  // Single loading screen for all auth states
  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Route permission check
  const currentPath = location.pathname;
  if (currentPath !== "/app" && !canViewRoute(currentPath)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
