import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { lovable } from "@/integrations/lovable";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, profileError } = useAuth();
  const { canViewRoute } = usePermissions();
  const location = useLocation();
  const redirecting = useRef(false);
  const [oauthError, setOauthError] = useState(false);

  // Auto-trigger Google login when not authenticated (only once)
  useEffect(() => {
    if (!loading && !session && !redirecting.current) {
      redirecting.current = true;
      setOauthError(false);
      lovable.auth
        .signInWithOAuth("google", {
          redirect_uri: window.location.origin + "/app/dashboard",
        })
        .then((result) => {
          if (result && "error" in result && result.error) {
            console.error("OAuth error:", result.error);
            setOauthError(true);
            redirecting.current = false;
          }
        })
        .catch((err) => {
          console.error("OAuth exception:", err);
          setOauthError(true);
          redirecting.current = false;
        });
    }
  }, [loading, session]);

  // Reset redirect flag when session becomes available
  useEffect(() => {
    if (session) {
      redirecting.current = false;
      setOauthError(false);
    }
  }, [session]);

  // Show error state if OAuth or profile loading failed
  if (oauthError || (!loading && session && profileError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6 max-w-sm">
          <p className="text-destructive font-medium">
            {oauthError
              ? "Não foi possível conectar ao Google. Verifique sua conexão."
              : "Erro ao carregar seu perfil. Tente novamente."}
          </p>
          <button
            onClick={() => {
              setOauthError(false);
              redirecting.current = false;
              if (profileError) {
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Route permission check
  const currentPath = location.pathname;
  const isDynamicRoute = currentPath.startsWith("/app/distrito/") || currentPath.startsWith("/app/congregacao/");
  if (currentPath !== "/app" && !isDynamicRoute && !canViewRoute(currentPath)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
