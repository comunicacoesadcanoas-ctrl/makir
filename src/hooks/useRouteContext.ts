import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to resolve the current route context (distrito or congregação).
 * Returns a set of congregação IDs to filter data, or null if global view.
 */
export function useRouteContext() {
  const params = useParams<{ distritoId?: string; congId?: string }>();
  const [congIds, setCongIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const distritoId = params.distritoId ?? null;
  const congId = params.congId ?? null;
  const isContextual = !!(distritoId || congId);

  useEffect(() => {
    if (congId) {
      setCongIds([congId]);
    } else if (distritoId) {
      setLoading(true);
      supabase
        .from("congregacoes")
        .select("id")
        .eq("distrito_id", distritoId)
        .then(({ data }) => {
          setCongIds((data || []).map(c => c.id));
          setLoading(false);
        });
    } else {
      setCongIds(null);
    }
  }, [distritoId, congId]);

  return { distritoId, congId, congIds, isContextual, loading };
}
