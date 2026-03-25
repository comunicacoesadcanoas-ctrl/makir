import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const allRoles: TipoAcesso[] = ["rede", "lider_distrito", "lider_congregacao"];

// Route permissions matrix
const routePermissions: Record<string, TipoAcesso[]> = {
  "/app/dashboard": allRoles,
  "/app/visitantes": allRoles,
  "/app/discipulos": allRoles,
  "/app/discipuladores": ["rede", "lider_distrito"],
  "/app/relatorios": allRoles,
  "/app/mapa-gcs": ["rede"],
  "/app/admin": ["rede"],
  "/app/configuracoes": ["rede"],
};

// Edit permissions
const editPermissions: Record<string, TipoAcesso[]> = {
  "/app/visitantes": allRoles,
  "/app/discipulos": allRoles,
  "/app/relatorios": allRoles,
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
  const isLiderDistrito = userRole === "lider_distrito" && isApproved;
  const isLiderCongregacao = userRole === "lider_congregacao" && isApproved;

  const canViewRoute = (route: string): boolean => {
    if (!userRole || !isApproved) return false;

    // Distrito sub-routes: admin can see all, lider_distrito can see their own
    if (route.startsWith("/app/distrito/")) {
      return isAdmin || isLiderDistrito;
    }

    // Congregacao sub-routes: admin + lider_distrito + lider_congregacao (own)
    if (route.startsWith("/app/congregacao/")) {
      return isAdmin || isLiderDistrito || isLiderCongregacao;
    }

    const allowed = routePermissions[route];
    if (!allowed) return false;
    return allowed.includes(userRole);
  };

  const canEditRoute = (route: string): boolean => {
    if (!userRole || !isApproved) return false;

    // Contextual routes inherit edit permissions
    if (route.startsWith("/app/distrito/") || route.startsWith("/app/congregacao/")) {
      return isAdmin || isLiderDistrito || isLiderCongregacao;
    }

    const allowed = editPermissions[route];
    if (!allowed) return false;
    return allowed.includes(userRole);
  };

  const getDefaultRoute = (): string => {
    return "/app/dashboard";
  };

  return {
    userRole,
    isAdmin,
    isApproved,
    isLiderDistrito,
    isLiderCongregacao,
    canViewRoute,
    canEditRoute,
    getDefaultRoute,
  };
}
