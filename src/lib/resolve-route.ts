import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

/**
 * Central route resolver — single source of truth for post-auth navigation.
 */
export function resolveUserLandingRoute(profile: UserProfile): string {
  if (!profile) return "/app";

  const routeMap: Record<string, string> = {
    rede: "/app/dashboard",
    recepcao: "/app/visitantes",
    discipulador: "/app/discipulos",
  };
  return routeMap[profile.tipo_acesso] || "/app";
}
