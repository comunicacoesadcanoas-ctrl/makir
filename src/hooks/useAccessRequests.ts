import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

export interface AccessRequest {
  id: string;
  user_id: string;
  acesso_atual: TipoAcesso;
  acesso_solicitado: TipoAcesso;
  status: "pendente" | "aprovado" | "rejeitado";
  observacao: string | null;
  criado_em: string;
  avaliado_em: string | null;
  avaliado_por: string | null;
}

export function useMyAccessRequests() {
  const { user } = useAuth();

  return useQuery<AccessRequest[]>({
    queryKey: ["access-requests", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_acesso")
        .select("*")
        .eq("user_id", user!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data as unknown as AccessRequest[]) ?? [];
    },
  });
}

export function useAllAccessRequests() {
  return useQuery<(AccessRequest & { user_nome?: string; user_email?: string })[]>({
    queryKey: ["access-requests", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_acesso")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      
      const requests = (data as unknown as AccessRequest[]) ?? [];
      
      // Fetch user info for each request
      const userIds = [...new Set(requests.map((r) => r.user_id))];
      if (userIds.length === 0) return [];
      
      const { data: users } = await supabase
        .from("users")
        .select("id, nome, email")
        .in("id", userIds);
      
      const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);
      
      return requests.map((r) => ({
        ...r,
        user_nome: userMap.get(r.user_id)?.nome,
        user_email: userMap.get(r.user_id)?.email,
      }));
    },
  });
}

export function useCreateAccessRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      acesso_atual,
      acesso_solicitado,
    }: {
      acesso_atual: TipoAcesso;
      acesso_solicitado: TipoAcesso;
    }) => {
      const { error } = await supabase.from("solicitacoes_acesso").insert({
        user_id: user!.id,
        acesso_atual,
        acesso_solicitado,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
    },
  });
}

export function useResolveAccessRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      decision,
      observacao,
    }: {
      requestId: string;
      decision: "aprovado" | "rejeitado";
      observacao?: string;
    }) => {
      // Update the request
      const { error } = await supabase
        .from("solicitacoes_acesso")
        .update({
          status: decision,
          avaliado_em: new Date().toISOString(),
          avaliado_por: user!.id,
          observacao: observacao || null,
        })
        .eq("id", requestId);
      if (error) throw error;

      // If approved, also update the user's tipo_acesso
      if (decision === "aprovado") {
        // First get the request to know the target access
        const { data: req } = await supabase
          .from("solicitacoes_acesso")
          .select("user_id, acesso_solicitado")
          .eq("id", requestId)
          .single();
        
        if (req) {
          const { error: updateErr } = await supabase
            .from("users")
            .update({ tipo_acesso: (req as any).acesso_solicitado })
            .eq("id", (req as any).user_id);
          if (updateErr) throw updateErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
