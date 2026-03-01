import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

/**
 * Central route resolver — single source of truth for post-auth navigation.
 */
export function resolveUserLandingRoute(_profile: UserProfile): string {
  return "/app/dashboard";
}
