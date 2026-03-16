import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  ready: boolean; // true once the full auth+profile check is done
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchOrCreateProfile(authUser: User): Promise<Tables<"users"> | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("[Auth] Profile fetch error:", error.message);
      return null;
    }
    if (data) return data;

    const { data: created, error: insertErr } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email || "",
        nome: authUser.user_metadata?.full_name || authUser.email || "",
        foto_url: authUser.user_metadata?.avatar_url || null,
        tipo_acesso: "lider_congregacao" as const,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("[Auth] Profile create error:", insertErr.message);
      return null;
    }
    return created;
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
  const mounted = useRef(true);
  const initDone = useRef(false);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const signOut = useCallback(async () => {
    clearState();
    try { await supabase.auth.signOut(); } catch {}
  }, [clearState]);

  const refreshProfile = useCallback(async () => {
    const u = user ?? (await supabase.auth.getUser()).data.user;
    if (u && mounted.current) {
      const p = await fetchOrCreateProfile(u);
      if (mounted.current) setProfile(p);
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

        // Validate session is still valid server-side
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

        const p = await fetchOrCreateProfile(validUser);
        if (!ignore) setProfile(p);
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

        // Don't process events until init is done to avoid races
        if (!initDone.current) return;

        if (event === "SIGNED_OUT") {
          clearState();
          return;
        }

        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          const p = await fetchOrCreateProfile(newSession.user);
          if (!ignore) setProfile(p);
        }
      }
    );

    // Safety timeout — never stay loading forever
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

  // Refresh profile on window focus
  useEffect(() => {
    const onFocus = async () => {
      if (user && mounted.current) {
        const p = await fetchOrCreateProfile(user);
        if (mounted.current) setProfile(p);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, ready, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
