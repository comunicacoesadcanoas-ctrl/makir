import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notificacao {
  id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .order("criado_em", { ascending: false })
      .limit(20);
    const items = (data as Notificacao[]) || [];
    setNotificacoes(items);
    setUnreadCount(items.filter((n) => !n.lida).length);
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    fetch();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("usuario_id", user.id)
      .eq("lida", false);
    fetch();
  };

  useEffect(() => { fetch(); }, [fetch]);

  return { notificacoes, unreadCount, markAsRead, markAllAsRead, refresh: fetch };
}
