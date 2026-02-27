import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { HeartHandshake } from "lucide-react";

type Visitante = Tables<"visitantes">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitante: Visitante;
  onSuccess: () => void;
}

export function AssumirDiscipuladoDialog({ open, onOpenChange, visitante, onSuccess }: Props) {
  const { user, profile } = useAuth();
  const { isAdmin } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [discipuladores, setDiscipuladores] = useState<{ id: string; nome: string }[]>([]);
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>("");

  useEffect(() => {
    if (!isAdmin) return;
    const fetchDiscipuladores = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, nome")
        .eq("status", "aprovado")
        .in("tipo_acesso", ["discipulador", "rede"]);
      setDiscipuladores(data || []);
    };
    fetchDiscipuladores();
  }, [isAdmin]);

  const handleAssumir = async () => {
    if (!user) return;
    setSaving(true);

    const discipuladorId = isAdmin && selectedDiscipulador ? selectedDiscipulador : user.id;
    const discipuladorNome = isAdmin && selectedDiscipulador
      ? discipuladores.find((d) => d.id === selectedDiscipulador)?.nome || ""
      : profile?.nome || user.user_metadata?.full_name || "";

    // Update visitante assumido_por (trigger will set status_cor to verde)
    const { error: updateError } = await supabase
      .from("visitantes")
      .update({ assumido_por: discipuladorId })
      .eq("id", visitante.id);

    if (updateError) {
      toast.error("Erro ao atualizar visitante");
      console.error(updateError);
      setSaving(false);
      return;
    }

    // Create discipulo record
    const { error: insertError } = await supabase.from("discipulos").insert({
      visitante_id: visitante.id,
      discipulador_id: discipuladorId,
      discipulador_nome: discipuladorNome,
    });

    if (insertError) {
      toast.error("Erro ao criar registro de discipulado");
      console.error(insertError);
      setSaving(false);
      return;
    }

    toast.success(`${visitante.nome} agora está em discipulado!`);
    onOpenChange(false);
    onSuccess();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <HeartHandshake className="h-5 w-5" />
            Assumir para Discipulado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deseja iniciar o discipulado de <strong className="text-foreground">{visitante.nome}</strong>?
          </p>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Atribuir a</Label>
              <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar discipulador" />
                </SelectTrigger>
                <SelectContent>
                  {discipuladores.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={handleAssumir}
              disabled={saving || (isAdmin && !selectedDiscipulador)}
              className="bg-success hover:bg-success/90 text-success-foreground gap-2"
            >
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
