import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { Search, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface VisitanteOption {
  id: string;
  nome: string;
  telefone: string;
  cidade: string | null;
}

export function NovoDiscipuloDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user, profile } = useAuth();
  const { isAdmin } = usePermissions();
  const [tab, setTab] = useState("visitante");
  const [saving, setSaving] = useState(false);

  // From visitante
  const [visitantes, setVisitantes] = useState<VisitanteOption[]>([]);
  const [searchVisitante, setSearchVisitante] = useState("");
  const [selectedVisitanteId, setSelectedVisitanteId] = useState<string | null>(null);
  const [loadingVisitantes, setLoadingVisitantes] = useState(false);

  // Manual
  const [manualNome, setManualNome] = useState("");
  const [manualTelefone, setManualTelefone] = useState("");
  const [manualCidade, setManualCidade] = useState("");

  // Discipulador select (for admin)
  const [discipuladores, setDiscipuladores] = useState<{ id: string; nome: string }[]>([]);
  const [selectedDiscipulador, setSelectedDiscipulador] = useState("");

  const fetchVisitantes = useCallback(async () => {
    setLoadingVisitantes(true);
    // Get visitantes that are NOT already in discipulos
    const { data: existingDiscipulos } = await supabase
      .from("discipulos")
      .select("visitante_id");
    
    const existingIds = (existingDiscipulos || []).map(d => d.visitante_id);

    let query = supabase
      .from("visitantes")
      .select("id, nome, telefone, cidade")
      .order("nome");

    const { data } = await query;
    const available = (data || []).filter(v => !existingIds.includes(v.id));
    setVisitantes(available);
    setLoadingVisitantes(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchVisitantes();
      if (isAdmin) {
        supabase
          .from("users")
          .select("id, nome")
          .eq("status", "aprovado")
          .in("tipo_acesso", ["discipulador", "rede"])
          .then(({ data }) => setDiscipuladores(data || []));
      }
    }
  }, [open, isAdmin, fetchVisitantes]);

  const filteredVisitantes = visitantes.filter(v =>
    !searchVisitante || v.nome.toLowerCase().includes(searchVisitante.toLowerCase())
  );

  const handleSubmitVisitante = async () => {
    if (!selectedVisitanteId || !user) return;
    setSaving(true);

    const discipuladorId = isAdmin && selectedDiscipulador ? selectedDiscipulador : user.id;
    const discipuladorNome = isAdmin && selectedDiscipulador
      ? discipuladores.find(d => d.id === selectedDiscipulador)?.nome || ""
      : profile?.nome || user.user_metadata?.full_name || "";

    // Update visitante
    await supabase.from("visitantes").update({ assumido_por: discipuladorId }).eq("id", selectedVisitanteId);

    const { error } = await supabase.from("discipulos").insert({
      visitante_id: selectedVisitanteId,
      discipulador_id: discipuladorId,
      discipulador_nome: discipuladorNome,
      congregacao_id: profile?.congregacao_id || null,
    });

    if (error) {
      toast.error("Erro ao criar discípulo");
      console.error(error);
    } else {
      toast.success("Discípulo adicionado com sucesso!");
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  const handleSubmitManual = async () => {
    if (!manualNome.trim() || !manualTelefone.trim() || !user) return;
    setSaving(true);

    const discipuladorId = isAdmin && selectedDiscipulador ? selectedDiscipulador : user.id;
    const discipuladorNome = isAdmin && selectedDiscipulador
      ? discipuladores.find(d => d.id === selectedDiscipulador)?.nome || ""
      : profile?.nome || user.user_metadata?.full_name || "";

    // Create visitante first
    const { data: newVisitante, error: vError } = await supabase.from("visitantes").insert({
      nome: manualNome.trim(),
      telefone: manualTelefone.trim(),
      cidade: manualCidade.trim() || null,
      cadastrado_por: user.id,
      cadastrado_por_nome: profile?.nome || user.user_metadata?.full_name || "",
      assumido_por: discipuladorId,
      quer_discipulado: true,
    }).select("id").single();

    if (vError || !newVisitante) {
      toast.error("Erro ao criar visitante");
      console.error(vError);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("discipulos").insert({
      visitante_id: newVisitante.id,
      discipulador_id: discipuladorId,
      discipulador_nome: discipuladorNome,
      congregacao_id: profile?.congregacao_id || null,
    });

    if (error) {
      toast.error("Erro ao criar discípulo");
      console.error(error);
    } else {
      toast.success("Discípulo adicionado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setManualNome("");
    setManualTelefone("");
    setManualCidade("");
    setSelectedVisitanteId(null);
    setSearchVisitante("");
    setSelectedDiscipulador("");
    setTab("visitante");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            Novo Discípulo
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="visitante" className="flex-1 gap-1.5">
              <Users className="h-3.5 w-3.5" /> Da base
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visitante" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar visitante..."
                value={searchVisitante}
                onChange={(e) => setSearchVisitante(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {loadingVisitantes ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
              ) : filteredVisitantes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum visitante disponível</p>
              ) : (
                filteredVisitantes.map(v => (
                  <Card
                    key={v.id}
                    className={`cursor-pointer transition-colors ${selectedVisitanteId === v.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    onClick={() => setSelectedVisitanteId(v.id)}
                  >
                    <CardContent className="py-2 px-3">
                      <p className="font-medium text-sm text-foreground">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">{v.telefone}{v.cidade ? ` • ${v.cidade}` : ""}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Atribuir a discipulador</Label>
                <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {discipuladores.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmitVisitante} disabled={saving || !selectedVisitanteId || (isAdmin && !selectedDiscipulador)}>
                {saving ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={manualNome} onChange={e => setManualNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input value={manualTelefone} onChange={e => setManualTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={manualCidade} onChange={e => setManualCidade(e.target.value)} placeholder="Cidade" />
            </div>

            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Atribuir a discipulador</Label>
                <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {discipuladores.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmitManual} disabled={saving || !manualNome.trim() || !manualTelefone.trim() || (isAdmin && !selectedDiscipulador)}>
                {saving ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
