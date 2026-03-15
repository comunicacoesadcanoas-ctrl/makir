import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type SidebarMode = "global" | "distrito" | "congregacao";

interface DistritoContext {
  id: string;
  nome: string;
  numero: number;
  congregacoes: { id: string; nome: string }[];
}

interface CongregacaoContext {
  id: string;
  nome: string;
  distritoId: string;
  distritoNome: string;
  distritoNumero: number;
}

interface SidebarContextResult {
  mode: SidebarMode;
  distrito: DistritoContext | null;
  congregacao: CongregacaoContext | null;
  loading: boolean;
}

export function useSidebarContext(): SidebarContextResult {
  const location = useLocation();
  const [distrito, setDistrito] = useState<DistritoContext | null>(null);
  const [congregacao, setCongregacao] = useState<CongregacaoContext | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract IDs from URL
  const distritoMatch = location.pathname.match(/^\/app\/distrito\/([^/]+)/);
  const congMatch = location.pathname.match(/^\/app\/congregacao\/([^/]+)/);

  const distritoId = distritoMatch?.[1] ?? null;
  const congId = congMatch?.[1] ?? null;

  const mode: SidebarMode = congId ? "congregacao" : distritoId ? "distrito" : "global";

  useEffect(() => {
    if (mode === "distrito" && distritoId) {
      setLoading(true);
      Promise.all([
        supabase.from("distritos").select("id, nome, numero").eq("id", distritoId).single(),
        supabase.from("congregacoes").select("id, nome").eq("distrito_id", distritoId).order("nome"),
      ]).then(([dRes, cRes]) => {
        if (dRes.data) {
          setDistrito({
            id: dRes.data.id,
            nome: dRes.data.nome,
            numero: dRes.data.numero,
            congregacoes: cRes.data || [],
          });
        }
        setCongregacao(null);
        setLoading(false);
      });
    } else if (mode === "congregacao" && congId) {
      setLoading(true);
      supabase
        .from("congregacoes")
        .select("id, nome, distrito_id")
        .eq("id", congId)
        .single()
        .then(async (cRes) => {
          if (cRes.data) {
            const dRes = await supabase
              .from("distritos")
              .select("id, nome, numero")
              .eq("id", cRes.data.distrito_id)
              .single();
            setCongregacao({
              id: cRes.data.id,
              nome: cRes.data.nome,
              distritoId: cRes.data.distrito_id,
              distritoNome: dRes.data?.nome || "",
              distritoNumero: dRes.data?.numero || 0,
            });
          }
          setDistrito(null);
          setLoading(false);
        });
    } else {
      setDistrito(null);
      setCongregacao(null);
    }
  }, [mode, distritoId, congId]);

  return { mode, distrito, congregacao, loading };
}
