import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { Check, Clock, BookOpen, Phone, MapPin, Calendar, FileText } from "lucide-react";

interface Licao {
  id: string;
  numero: number;
  concluida: boolean;
  data_conclusao: string | null;
}

interface DiscipuloDetail {
  id: string;
  discipulador_nome: string;
  progresso_percentual: number;
  licoes_concluidas: number;
  data_inicio: string;
  status_cor: string;
  visitantes: {
    nome: string;
    telefone: string;
    cidade: string | null;
    endereco: string | null;
    observacoes: string | null;
    aceitou_jesus: boolean;
    frequenta_igreja: boolean;
    quer_gc: boolean;
    quer_discipulado: boolean;
    estado_civil: string | null;
    sexo: string | null;
    ano: string | null;
    criado_em: string;
  } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discipuloId: string;
  onUpdate: () => void;
}

const licaoTitulos: Record<number, string> = {
  1: "Certeza da Salvação",
  2: "Segurança da Salvação",
  3: "A Bíblia",
  4: "Oração",
  5: "Comunhão",
  6: "Testemunho",
  7: "Igreja",
  8: "Obediência",
  9: "Espírito Santo",
  10: "Tentação",
  11: "Mordomia",
  12: "Dons Espirituais",
  13: "Vida Devocional",
};

export function DiscipuloDetailDialog({ open, onOpenChange, discipuloId, onUpdate }: Props) {
  const { userRole } = usePermissions();
  const canEdit = !!userRole;
  const [discipulo, setDiscipulo] = useState<DiscipuloDetail | null>(null);
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: dData }, { data: lData }] = await Promise.all([
      supabase
        .from("discipulos")
        .select("id, discipulador_nome, progresso_percentual, licoes_concluidas, data_inicio, status_cor, visitantes(nome, telefone, cidade, endereco, observacoes, aceitou_jesus, frequenta_igreja, quer_gc, quer_discipulado, estado_civil, sexo, ano, criado_em)")
        .eq("id", discipuloId)
        .single(),
      supabase
        .from("licoes")
        .select("*")
        .eq("discipulo_id", discipuloId)
        .order("numero", { ascending: true }),
    ]);

    setDiscipulo(dData as unknown as DiscipuloDetail);
    setLicoes((lData as Licao[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [discipuloId]);

  const toggleLicao = async (licao: Licao) => {
    const newConcluida = !licao.concluida;
    const { error } = await supabase
      .from("licoes")
      .update({
        concluida: newConcluida,
        data_conclusao: newConcluida ? new Date().toISOString() : null,
      })
      .eq("id", licao.id);

    if (error) {
      toast.error("Erro ao atualizar lição");
      console.error(error);
    } else {
      toast.success(newConcluida ? "Lição concluída!" : "Lição desmarcada");
      fetchData();
      onUpdate();
    }
  };

  if (loading || !discipulo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const v = discipulo.visitantes;
  const nome = v?.nome || "Sem nome";
  const initials = nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-lg">{nome}</p>
              <p className="text-xs font-normal text-muted-foreground">Discipulador: {discipulo.discipulador_nome}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-semibold text-foreground">{discipulo.licoes_concluidas}/13 ({discipulo.progresso_percentual}%)</span>
          </div>
          <Progress value={discipulo.progresso_percentual} className="h-3" />
        </div>

        {/* Visitor info */}
        {v && (
          <div className="space-y-2 text-sm">
            <Separator />
            <p className="font-medium text-foreground text-xs uppercase tracking-wider">Dados do cadastro</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              {v.telefone && (
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{v.telefone}</div>
              )}
              {v.cidade && (
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{v.cidade}</div>
              )}
              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Início: {new Date(discipulo.data_inicio).toLocaleDateString("pt-BR")}</div>
              {v.estado_civil && <span className="capitalize">{v.estado_civil}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {v.aceitou_jesus && <Badge variant="outline" className="text-xs">Aceitou Jesus</Badge>}
              {v.frequenta_igreja && <Badge variant="outline" className="text-xs">Frequenta igreja</Badge>}
              {v.quer_gc && <Badge variant="outline" className="text-xs">Quer GC</Badge>}
              {v.quer_discipulado && <Badge variant="outline" className="text-xs">Quer discipulado</Badge>}
            </div>
            {v.observacoes && (
              <div className="flex items-start gap-1.5 mt-1">
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="text-xs">{v.observacoes}</span>
              </div>
            )}
          </div>
        )}

        {/* Lessons */}
        <Separator />
        <div className="space-y-1.5">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Lições
          </p>
          {licoes.map((licao) => {
            const titulo = licaoTitulos[licao.numero] || `Lição ${licao.numero}`;
            return (
              <button
                key={licao.id}
                onClick={() => canEdit && toggleLicao(licao)}
                disabled={!canEdit}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                  licao.concluida
                    ? "border-success/30 bg-success/5"
                    : "border-border hover:border-muted-foreground/30"
                } ${!canEdit ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  licao.concluida
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {licao.concluida ? <Check className="h-3.5 w-3.5" /> : licao.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${licao.concluida ? "text-success" : "text-foreground"}`}>
                    {String(licao.numero).padStart(2, "0")}. {titulo}
                  </p>
                  {licao.data_conclusao && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(licao.data_conclusao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
