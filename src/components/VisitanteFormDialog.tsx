import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useCongregacoes } from "@/hooks/useCongregacoes";
import { toast } from "sonner";
import type { Tables, Database } from "@/integrations/supabase/types";

type Visitante = Tables<"visitantes">;

const visitanteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20),
  cidade: z.string().trim().max(100).optional().or(z.literal("")),
  endereco: z.string().trim().max(300).optional().or(z.literal("")),
  ano: z.string().trim().max(10).optional().or(z.literal("")),
  observacoes: z.string().trim().max(1000).optional().or(z.literal("")),
  aceitou_jesus: z.boolean(),
  frequenta_igreja: z.boolean(),
  quer_gc: z.boolean(),
  quer_discipulado: z.boolean(),
  estado_civil: z.enum(["solteiro", "casado", "divorciado"]).optional().nullable(),
  sexo: z.enum(["masculino", "feminino"]).optional().nullable(),
});

type FormData = z.infer<typeof visitanteSchema>;

interface VisitanteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitante?: Visitante | null;
  onSuccess: () => void;
}

export function VisitanteFormDialog({ open, onOpenChange, visitante, onSuccess }: VisitanteFormDialogProps) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const isEditing = !!visitante;

  const form = useForm<FormData>({
    resolver: zodResolver(visitanteSchema),
    defaultValues: {
      nome: visitante?.nome || "",
      telefone: visitante?.telefone || "",
      cidade: visitante?.cidade || "",
      endereco: visitante?.endereco || "",
      ano: visitante?.ano || "",
      observacoes: visitante?.observacoes || "",
      aceitou_jesus: visitante?.aceitou_jesus || false,
      frequenta_igreja: visitante?.frequenta_igreja || false,
      quer_gc: visitante?.quer_gc || false,
      quer_discipulado: visitante?.quer_discipulado || false,
      estado_civil: (visitante?.estado_civil as FormData["estado_civil"]) || null,
      sexo: (visitante?.sexo as FormData["sexo"]) || null,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSaving(true);

    const payload = {
      nome: data.nome,
      telefone: data.telefone,
      cidade: data.cidade || null,
      endereco: data.endereco || null,
      ano: data.ano || null,
      observacoes: data.observacoes || null,
      aceitou_jesus: data.aceitou_jesus,
      frequenta_igreja: data.frequenta_igreja,
      quer_gc: data.quer_gc,
      quer_discipulado: data.quer_discipulado,
      estado_civil: data.estado_civil || null,
      sexo: data.sexo || null,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from("visitantes").update(payload).eq("id", visitante.id));
    } else {
      ({ error } = await supabase.from("visitantes").insert({
        ...payload,
        cadastrado_por: user.id,
        cadastrado_por_nome: profile?.nome || user.user_metadata?.full_name || "Desconhecido",
      }));
    }

    if (error) {
      toast.error("Erro ao salvar visitante");
      console.error(error);
    } else {
      toast.success(isEditing ? "Visitante atualizado!" : "Visitante cadastrado!");
      onOpenChange(false);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditing ? "Editar Visitante" : "Novo Visitante"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Required fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...form.register("nome")} placeholder="Nome completo" />
              {form.formState.errors.nome && (
                <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" {...form.register("telefone")} placeholder="(00) 00000-0000" />
              {form.formState.errors.telefone && (
                <p className="text-xs text-destructive">{form.formState.errors.telefone.message}</p>
              )}
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...form.register("cidade")} placeholder="Cidade" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ano">Ano</Label>
              <Input id="ano" {...form.register("ano")} placeholder="Ex: 2026" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...form.register("endereco")} placeholder="Endereço completo" />
          </div>

          {/* Selection fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sexo</Label>
              <Select
                value={form.watch("sexo") || ""}
                onValueChange={(v) => form.setValue("sexo", v as FormData["sexo"])}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado Civil</Label>
              <Select
                value={form.watch("estado_civil") || ""}
                onValueChange={(v) => form.setValue("estado_civil", v as FormData["estado_civil"])}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro</SelectItem>
                  <SelectItem value="casado">Casado</SelectItem>
                  <SelectItem value="divorciado">Divorciado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Boolean toggles */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <BoolField label="Aceitou Jesus?" name="aceitou_jesus" form={form} />
            <BoolField label="Já frequenta uma Igreja?" name="frequenta_igreja" form={form} />
            <BoolField label="Quer GC?" name="quer_gc" form={form} />
            <BoolField label="Quer Discipulado?" name="quer_discipulado" form={form} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...form.register("observacoes")} placeholder="Anotações..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BoolField({ label, name, form }: { label: string; name: keyof FormData; form: any }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch
        checked={form.watch(name)}
        onCheckedChange={(v) => form.setValue(name, v)}
      />
    </div>
  );
}
