import { createContext, useContext, ReactNode } from "react";
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

// Minimal user-shape compatible with existing call sites that read `.id` /
// `.email` / `.user_metadata`. Cast as any to satisfy Supabase's User type
// without dragging the whole auth dependency into a guest-only app.
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
  session: { user: guestUser }, // truthy so Login.tsx redirects away
  user: guestUser,
  profile: guestProfile,
  loading: false,
  ready: true,
  needsOnboarding: false,
  signOut: noop,
  refreshProfile: noop,
  createProfile: noop,
};

const AuthContext = createContext<AuthContextType>(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
