import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCongregacoes } from "@/hooks/useCongregacoes";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovoDiscipuladorDialog({ open, onOpenChange, onSuccess }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [congregacaoId, setCongregacaoId] = useState("");
  const [saving, setSaving] = useState(false);
  const { congregacoes, distritos } = useCongregacoes();

  const resetForm = () => {
    setNome("");
    setEmail("");
    setCongregacaoId("");
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim()) return;
    setSaving(true);

    // Note: This creates a user record. The actual auth account would need to be created separately.
    // For now we create the record so it shows as a discipulador option.
    const { error } = await supabase.from("users").insert({
      id: crypto.randomUUID(),
      nome: nome.trim(),
      email: email.trim(),
      tipo_acesso: "discipulador" as const,
      status: "aprovado" as const,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Este e-mail já está cadastrado");
      } else {
        toast.error("Erro ao cadastrar discipulador");
        console.error(error);
      }
    } else {
      toast.success("Discipulador cadastrado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserCog className="h-5 w-5" />
            Novo Discipulador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !nome.trim() || !email.trim()}>
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
