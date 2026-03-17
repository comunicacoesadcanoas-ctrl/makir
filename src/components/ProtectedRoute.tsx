import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, ready, needsOnboarding } = useAuth();
  const { canViewRoute } = usePermissions();
  const location = useLocation();

  // 1. Auth check not done yet — spinner
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Not authenticated — go to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Needs onboarding — redirect to role selection
  if (needsOnboarding) {
    const isOnboardingRoute = location.pathname === "/app/selecionar-acesso";
    if (!isOnboardingRoute) {
      return <Navigate to="/app/selecionar-acesso" replace />;
    }
  }

  // 4. Authenticated but no profile and not onboarding — show error
  if (!profile && !needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // 5. Route permission check (skip for onboarding route and when profile is null during onboarding)
  if (profile) {
    const currentPath = location.pathname;
    const isDynamicRoute =
      currentPath.startsWith("/app/distrito/") ||
      currentPath.startsWith("/app/congregacao/");

    if (currentPath !== "/app" && currentPath !== "/app/selecionar-acesso" && !isDynamicRoute && !canViewRoute(currentPath)) {
      return <Navigate to="/app" replace />;
    }
  }

  return <>{children}</>;
}
