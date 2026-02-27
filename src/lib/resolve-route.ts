import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

/**
 * Central route resolver — single source of truth for post-auth navigation.
 */
export function resolveUserLandingRoute(profile: UserProfile): string {
  if (!profile) return "/selecionar-acesso";

  switch (profile.status) {
    case "pendente":
      return "/aguardando-aprovacao";
    case "rejeitado":
      return "/acesso-negado";
    case "aprovado": {
      const routeMap: Record<string, string> = {
        rede: "/app/dashboard",
        recepcao: "/app/visitantes",
        discipulador: "/app/discipulos",
      };
      return routeMap[profile.tipo_acesso] || "/app";
    }
    default:
      return "/selecionar-acesso";
  }
}
