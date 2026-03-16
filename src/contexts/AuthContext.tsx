import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users"> | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  profileError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileError: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const initialLoadDone = useRef(false);
  const signingOut = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setProfileError(false);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email || "",
              nome: user.user_metadata?.full_name || user.email || "",
              foto_url: user.user_metadata?.avatar_url || null,
              tipo_acesso: "lider_congregacao" as const,
            })
            .select("*")
            .single();
          if (insertError) {
            console.error("Failed to create profile:", insertError);
            setProfileError(true);
            setProfile(null);
            return null;
          }
          if (newProfile) {
            setProfile(newProfile);
            return newProfile;
          }
        }
      }

      setProfile(data);
      return data;
    } catch (e) {
      console.error("Failed to fetch profile:", e);
      setProfileError(true);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = user ?? (await supabase.auth.getUser()).data.user;
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileError(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    // Small delay before allowing re-auth to prevent immediate re-trigger
    setTimeout(() => {
      signingOut.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      // Validate session by checking the user with the server
      if (session) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          // Session is stale (e.g., invalid refresh token) — clear it
          console.warn("Stale session detected, clearing:", error?.message);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            setLoading(false);
          }
          return;
        }
        setSession(session);
        setUser(user);
        await fetchProfile(user.id);
      } else {
        setSession(null);
        setUser(null);
      }

      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }).catch(() => {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        // Ignore events during explicit sign-out to prevent re-trigger race
        if (signingOut.current && event !== "SIGNED_OUT") return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            setLoading(false);
          }
          return;
        }

        if (event === "TOKEN_REFRESHED" && !session) {
          // Token refresh failed — force sign out
          console.warn("Token refresh failed, signing out");
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            if (!cancelled) fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
          setLoading(false);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile on window focus
  useEffect(() => {
    const onFocus = () => {
      if (user) fetchProfile(user.id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileError, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
