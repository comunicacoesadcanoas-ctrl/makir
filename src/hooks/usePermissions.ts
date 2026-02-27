import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

// Route permissions matrix
const routePermissions: Record<string, TipoAcesso[]> = {
  "/app/dashboard": ["rede"],
  "/app/visitantes": ["recepcao", "discipulador", "rede"],
  "/app/discipulos": ["discipulador", "rede"],
  "/app/relatorios": ["discipulador", "rede"],
  "/app/mapa-gcs": ["discipulador", "rede"],
  "/app/admin": ["rede"],
  "/app/configuracoes": ["rede"],
};

// Edit permissions (recepcao can edit visitantes, discipulador can only read visitantes)
const editPermissions: Record<string, TipoAcesso[]> = {
  "/app/visitantes": ["recepcao", "rede"],
  "/app/discipulos": ["discipulador", "rede"],
  "/app/relatorios": ["rede"],
  "/app/mapa-gcs": ["rede"],
  "/app/admin": ["rede"],
  "/app/dashboard": ["rede"],
  "/app/configuracoes": ["rede"],
};

export function usePermissions() {
  const { profile } = useAuth();

  const userRole = profile?.tipo_acesso ?? null;
  const isApproved = profile?.status === "aprovado";
  const isAdmin = userRole === "rede" && isApproved;

  const canViewRoute = (route: string): boolean => {
    if (!userRole || !isApproved) return false;
    const allowed = routePermissions[route];
    if (!allowed) return false;
    return allowed.includes(userRole);
  };

  const canEditRoute = (route: string): boolean => {
    if (!userRole || !isApproved) return false;
    const allowed = editPermissions[route];
    if (!allowed) return false;
    return allowed.includes(userRole);
  };

  // Get first allowed route for redirect after login
  const getDefaultRoute = (): string => {
    if (!userRole || !isApproved) return "/login";
    const orderedRoutes = [
      "/app/dashboard",
      "/app/visitantes",
      "/app/discipulos",
      "/app/relatorios",
      "/app/mapa-gcs",
    ];
    return orderedRoutes.find((r) => canViewRoute(r)) || "/login";
  };

  return {
    userRole,
    isAdmin,
    isApproved,
    canViewRoute,
    canEditRoute,
    getDefaultRoute,
  };
}
