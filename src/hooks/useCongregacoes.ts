import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Congregacao {
  id: string;
  distrito_id: string;
  nome: string;
}

interface Distrito {
  id: string;
  numero: number;
  nome: string;
}

export function useCongregacoes() {
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("congregacoes").select("id, distrito_id, nome").order("nome"),
      supabase.from("distritos").select("id, numero, nome").order("numero"),
    ]).then(([cRes, dRes]) => {
      setCongregacoes(cRes.data || []);
      setDistritos(dRes.data || []);
      setLoading(false);
    });
  }, []);

  return { congregacoes, distritos, loading };
}
