import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const { canViewRoute } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/selecionar-acesso" replace />;
  }

  if (profile.status === "pendente") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  if (profile.status === "rejeitado") {
    return <Navigate to="/acesso-negado" replace />;
  }

  // Check route-level permission (skip for /app itself since it redirects)
  const currentPath = location.pathname;
  if (currentPath !== "/app" && !canViewRoute(currentPath)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
