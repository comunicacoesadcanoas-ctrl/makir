import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Update discipulo status colors
    await supabase.rpc("atualizar_status_discipulos");

    // 2. Get all approved users for targeted notifications
    const { data: users } = await supabase
      .from("users")
      .select("id, tipo_acesso")
      .eq("status", "aprovado");

    if (!users) {
      return new Response(JSON.stringify({ ok: true, message: "No users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications: { usuario_id: string; tipo: string; mensagem: string }[] = [];

    // 3. For discipuladores (acesso 02): check their disciples without recent activity
    const discipuladores = users.filter((u) => u.tipo_acesso === "discipulador");
    for (const disc of discipuladores) {
      const { count } = await supabase
        .from("discipulos")
        .select("*", { count: "exact", head: true })
        .eq("discipulador_id", disc.id)
        .in("status_cor", ["vermelho", "amarelo"]);

      if (count && count > 0) {
        notifications.push({
          usuario_id: disc.id,
          tipo: "alerta_discipulado",
          mensagem: `Você tem ${count} discípulo${count > 1 ? "s" : ""} sem relatório recente.`,
        });
      }
    }

    // 4. For rede (acesso 03): multiple alerts
    const admins = users.filter((u) => u.tipo_acesso === "rede");

    // Visitantes amarelos não assumidos há mais de 7 dias
    const { count: visitantesNaoAssumidos } = await supabase
      .from("visitantes")
      .select("*", { count: "exact", head: true })
      .eq("status_cor", "amarelo")
      .is("assumido_por", null)
      .lt("criado_em", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Usuários pendentes
    const { count: pendentes } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // Discípulos vermelhos (global)
    const { count: discipulosInativos } = await supabase
      .from("discipulos")
      .select("*", { count: "exact", head: true })
      .eq("status_cor", "vermelho");

    for (const admin of admins) {
      if (visitantesNaoAssumidos && visitantesNaoAssumidos > 0) {
        notifications.push({
          usuario_id: admin.id,
          tipo: "alerta_visitantes",
          mensagem: `${visitantesNaoAssumidos} visitante${visitantesNaoAssumidos > 1 ? "s" : ""} quer${visitantesNaoAssumidos > 1 ? "em" : ""} discipulado e não foi${visitantesNaoAssumidos > 1 ? "ram" : ""} assumido${visitantesNaoAssumidos > 1 ? "s" : ""} há mais de 7 dias.`,
        });
      }
      if (pendentes && pendentes > 0) {
        notifications.push({
          usuario_id: admin.id,
          tipo: "alerta_pendentes",
          mensagem: `${pendentes} novo${pendentes > 1 ? "s" : ""} usuário${pendentes > 1 ? "s" : ""} aguardando aprovação.`,
        });
      }
      if (discipulosInativos && discipulosInativos > 0) {
        notifications.push({
          usuario_id: admin.id,
          tipo: "alerta_discipulado",
          mensagem: `${discipulosInativos} discípulo${discipulosInativos > 1 ? "s" : ""} sem atividade recente.`,
        });
      }
    }

    // 5. Insert all notifications
    if (notifications.length > 0) {
      await supabase.from("notificacoes").insert(notifications);
    }

    return new Response(
      JSON.stringify({ ok: true, notifications_created: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
