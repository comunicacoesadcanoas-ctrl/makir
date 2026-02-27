import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();

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

  // No profile yet → needs to select access type
  if (!profile) {
    return <Navigate to="/selecionar-acesso" replace />;
  }

  // Pending approval
  if (profile.status === "pendente") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  // Rejected
  if (profile.status === "rejeitado") {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <>{children}</>;
}
