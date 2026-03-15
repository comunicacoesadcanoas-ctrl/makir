import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface BadgeCounts {
  visitantesAmarelos: number;
  discipulosVermelhos: number;
  pendentesAdmin: number;
}

export function useBadgeCounts() {
  const { user } = useAuth();
  const { userRole, isAdmin } = usePermissions();
  const [counts, setCounts] = useState<BadgeCounts>({ visitantesAmarelos: 0, discipulosVermelhos: 0, pendentesAdmin: 0 });

  const fetchCounts = useCallback(async () => {
    if (!user || !userRole) return;

    // Visitantes amarelos não assumidos
    const { count: visitantesAmarelos } = await supabase
      .from("visitantes")
      .select("*", { count: "exact", head: true })
      .eq("status_cor", "amarelo")
      .is("assumido_por", null);

    // Discípulos vermelhos (RLS handles scoping)
    const { count: discipulosVermelhos } = await supabase
      .from("discipulos")
      .select("*", { count: "exact", head: true })
      .eq("status_cor", "vermelho");

    // Pendentes admin
    let pendentesAdmin = 0;
    if (isAdmin) {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      pendentesAdmin = count || 0;
    }

    setCounts({
      visitantesAmarelos: visitantesAmarelos || 0,
      discipulosVermelhos: discipulosVermelhos || 0,
      pendentesAdmin,
    });
  }, [user, userRole, isAdmin]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return { ...counts, refresh: fetchCounts };
}
