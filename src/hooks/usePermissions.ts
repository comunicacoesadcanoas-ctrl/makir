import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

// Route permissions matrix
const routePermissions: Record<string, TipoAcesso[]> = {
  "/app/dashboard": ["recepcao", "discipulador", "rede", "lider_distrito", "lider_congregacao"],
  "/app/visitantes": ["recepcao", "discipulador", "rede", "lider_distrito", "lider_congregacao"],
  "/app/discipulos": ["discipulador", "rede", "lider_distrito", "lider_congregacao"],
  "/app/discipuladores": ["discipulador", "rede", "lider_distrito"],
  "/app/relatorios": ["discipulador", "rede", "lider_distrito", "lider_congregacao"],
  "/app/mapa-gcs": ["rede"],
  "/app/admin": ["rede"],
  "/app/configuracoes": ["rede"],
};

// Edit permissions
const editPermissions: Record<string, TipoAcesso[]> = {
  "/app/visitantes": ["recepcao", "rede", "lider_distrito", "lider_congregacao"],
  "/app/discipulos": ["discipulador", "rede", "lider_distrito", "lider_congregacao"],
  "/app/relatorios": ["discipulador", "rede", "lider_distrito", "lider_congregacao"],
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
    // Dynamic routes for drill-down
    if (route.startsWith("/app/distrito/")) return isAdmin;
    if (route.startsWith("/app/congregacao/")) return isAdmin || isLiderDistrito;
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

  const getDefaultRoute = (): string => {
    if (!userRole || !isApproved) return "/app/dashboard";
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
