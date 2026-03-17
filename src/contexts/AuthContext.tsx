import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;
type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  ready: boolean;
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfile: (tipoAcesso: TipoAcesso) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Tables<"users"> | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Auth] Profile fetch error:", error.message);
      return null;
    }
    return data; // null if not found — means onboarding needed
  } catch (e) {
    console.error("[Auth] Profile exception:", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const mounted = useRef(true);
  const initDone = useRef(false);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsOnboarding(false);
  }, []);

  const signOut = useCallback(async () => {
    clearState();
    try { await supabase.auth.signOut(); } catch {}
  }, [clearState]);

  const refreshProfile = useCallback(async () => {
    const u = user ?? (await supabase.auth.getUser()).data.user;
    if (u && mounted.current) {
      const p = await fetchProfile(u.id);
      if (mounted.current) {
        setProfile(p);
        setNeedsOnboarding(!p);
      }
    }
  }, [user]);

  const createProfile = useCallback(async (tipoAcesso: TipoAcesso) => {
    const authUser = user ?? (await supabase.auth.getUser()).data.user;
    if (!authUser) throw new Error("Usuário não autenticado");

    const nome = authUser.user_metadata?.full_name || authUser.email || "";

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email || "",
        nome,
        foto_url: authUser.user_metadata?.avatar_url || null,
        tipo_acesso: tipoAcesso,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Notify admin users about the new registration
    await supabase.rpc("notify_admins_new_user", { user_name: nome }).catch(() => {});

    if (mounted.current) {
      setProfile(data);
      setNeedsOnboarding(false);
    }
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    let ignore = false;

    const initialize = async () => {
      try {
        const { data: { session: sess } } = await supabase.auth.getSession();
        if (ignore) return;

        if (!sess) {
          clearState();
          return;
        }

        const { data: { user: validUser }, error } = await supabase.auth.getUser();
        if (ignore) return;

        if (error || !validUser) {
          console.warn("[Auth] Stale session, clearing");
          try { await supabase.auth.signOut(); } catch {}
          clearState();
          return;
        }

        setSession(sess);
        setUser(validUser);

        const p = await fetchProfile(validUser.id);
        if (!ignore) {
          setProfile(p);
          setNeedsOnboarding(!p);
        }
      } catch (e) {
        console.error("[Auth] Init error:", e);
        clearState();
      } finally {
        if (!ignore) {
          initDone.current = true;
          setLoading(false);
          setReady(true);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (ignore) return;
        if (!initDone.current) return;

        if (event === "SIGNED_OUT") {
          clearState();
          return;
        }

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          const p = await fetchProfile(newSession.user.id);
          if (!ignore) {
            setProfile(p);
            setNeedsOnboarding(!p);
          }
        }
      }
    );

    const safetyTimer = setTimeout(() => {
      if (!initDone.current) {
        console.warn("[Auth] Safety timeout reached");
        initDone.current = true;
        setLoading(false);
        setReady(true);
      }
    }, 5000);

    return () => {
      ignore = true;
      mounted.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = async () => {
      if (user && mounted.current) {
        const p = await fetchProfile(user.id);
        if (mounted.current) {
          setProfile(p);
          setNeedsOnboarding(!p);
        }
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, ready, needsOnboarding, signOut, refreshProfile, createProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
