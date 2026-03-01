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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;

      // Auto-create profile if none exists
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
              tipo_acesso: "recepcao" as const,
            })
            .select("*")
            .single();
          if (!insertError && newProfile) {
            setProfile(newProfile);
            return newProfile;
          }
        }
      }

      setProfile(data);
      return data;
    } catch (e) {
      console.error("Failed to fetch profile:", e);
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
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;
        setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      if (!initialLoadDone.current) {
        console.warn("Auth init timed out, releasing loading state");
        initialLoadDone.current = true;
        setLoading(false);
      }
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
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

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Refresh profile on window focus (catches admin approvals while tab was inactive)
  useEffect(() => {
    const onFocus = () => {
      if (user) fetchProfile(user.id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
