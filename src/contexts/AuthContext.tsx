import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fetches or creates a user profile row in public.users.
 * Returns the profile or null on failure.
 */
async function upsertProfile(authUser: User): Promise<Tables<"users"> | null> {
  // 1. Try to fetch existing profile
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

  // 2. Profile doesn't exist — create it
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
    console.error("[Auth] Profile creation error:", insertErr.message);
    return null;
  }
  return created;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  // ---- helpers ----
  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const hydrateUser = useCallback(async (sess: Session) => {
    // Validate the session token server-side
    const { data: { user: validUser }, error } = await supabase.auth.getUser();
    if (error || !validUser) {
      console.warn("[Auth] Session invalid, clearing:", error?.message);
      await supabase.auth.signOut();
      clearState();
      return;
    }

    if (!mounted.current) return;
    setSession(sess);
    setUser(validUser);

    const p = await upsertProfile(validUser);
    if (mounted.current) setProfile(p);
  }, [clearState]);

  // ---- initial load ----
  useEffect(() => {
    mounted.current = true;
    let ignore = false;

    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (ignore) return;

        if (currentSession) {
          await hydrateUser(currentSession);
        }
      } catch (e) {
        console.error("[Auth] Init error:", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    init();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (ignore) return;

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              // Fetch profile in a microtask to avoid Supabase auth deadlock
              setTimeout(async () => {
                if (!ignore) {
                  const p = await upsertProfile(newSession.user);
                  if (!ignore) setProfile(p);
                }
              }, 0);
            }
            break;

          case "SIGNED_OUT":
            clearState();
            break;
        }

        if (loading) setLoading(false);
      }
    );

    return () => {
      ignore = true;
      mounted.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh profile on window focus (picks up role/status changes immediately)
  useEffect(() => {
    const onFocus = async () => {
      if (user) {
        const p = await upsertProfile(user);
        if (mounted.current) setProfile(p);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  // ---- actions ----
  const signOut = useCallback(async () => {
    clearState();
    await supabase.auth.signOut();
  }, [clearState]);

  const refreshProfile = useCallback(async () => {
    const u = user ?? (await supabase.auth.getUser()).data.user;
    if (u) {
      const p = await upsertProfile(u);
      if (mounted.current) setProfile(p);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
