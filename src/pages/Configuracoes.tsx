import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Shield, Database, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { isAdmin } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    nome_organizacao: "",
    cidade_padrao: "",
    latitude_padrao: -29.9167,
    longitude_padrao: -51.1833,
    email_admin: "",
    dias_inatividade: 15,
  });

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("configuracoes")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      setConfig({
        id: data.id,
        nome_organizacao: data.nome_organizacao || "",
        cidade_padrao: data.cidade_padrao || "",
        latitude_padrao: data.latitude_padrao || -29.9167,
        longitude_padrao: data.longitude_padrao || -51.1833,
        email_admin: data.email_admin || "",
        dias_inatividade: data.dias_inatividade || 15,
      });
    }
    if (error) console.error(error);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("configuracoes")
      .update({
        nome_organizacao: config.nome_organizacao.trim(),
        cidade_padrao: config.cidade_padrao.trim(),
        email_admin: config.email_admin.trim() || null,
        dias_inatividade: config.dias_inatividade,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", config.id);

    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações salvas!");
    setSaving(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-sm border-border">
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Acesso restrito ao administrador da rede.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Organização
          </CardTitle>
          <CardDescription>Dados gerais do ministério</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da organização / ministério</Label>
            <Input
              value={config.nome_organizacao}
              onChange={e => setConfig(c => ({ ...c, nome_organizacao: e.target.value }))}
              placeholder="Ex: Igreja Batista Central"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade padrão (centralizar mapa)</Label>
            <Input
              value={config.cidade_padrao}
              onChange={e => setConfig(c => ({ ...c, cidade_padrao: e.target.value }))}
              placeholder="Ex: Canoas, RS"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email do administrador principal</Label>
            <Input
              type="email"
              value={config.email_admin}
              onChange={e => setConfig(c => ({ ...c, email_admin: e.target.value }))}
              placeholder="admin@igreja.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Alertas
          </CardTitle>
          <CardDescription>Configure os parâmetros de notificações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Dias de inatividade para alerta</Label>
            <Input
              type="number"
              min="1"
              max="90"
              value={config.dias_inatividade}
              onChange={e => setConfig(c => ({ ...c, dias_inatividade: parseInt(e.target.value) || 15 }))}
            />
            <p className="text-xs text-muted-foreground">
              Discípulos sem atividade por mais de {config.dias_inatividade} dias serão marcados como "Amarelo".
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
