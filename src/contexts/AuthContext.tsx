import { createContext, useContext, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";

type UserProfile = Tables<"users">;
type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const GUEST_ID = "00000000-0000-0000-0000-000000000000";

// Synthetic guest profile — full admin so the entire app is unlocked.
const guestProfile: UserProfile = {
  id: GUEST_ID,
  email: "guest@makir.app",
  nome: "Visitante",
  foto_url: null,
  tipo_acesso: "rede" as TipoAcesso,
  status: "aprovado" as Database["public"]["Enums"]["status_enum"],
  congregacao_id: null,
  distrito_id: null,
  criado_em: new Date().toISOString(),
};

const guestUser = {
  id: GUEST_ID,
  email: "guest@makir.app",
  user_metadata: { full_name: "Visitante", avatar_url: null },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

interface AuthContextType {
  session: unknown;
  user: typeof guestUser;
  profile: UserProfile;
  loading: boolean;
  ready: boolean;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfile: (tipoAcesso: TipoAcesso) => Promise<void>;
}

const noop = async () => {};

const value: AuthContextType = {
  session: { user: guestUser },
  user: guestUser,
  profile: guestProfile,
  loading: false,
  ready: true,
  needsOnboarding: false,
  signOut: async () => {
    try { await supabase.auth.signOut(); } catch {}
  },
  refreshProfile: noop,
  createProfile: noop,
};

const AuthContext = createContext<AuthContextType>(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Clear any stale Supabase session left over from the previous auth flow.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase.auth.signOut().catch(() => {});
      }
    });
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
