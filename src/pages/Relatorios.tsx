import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouteContext } from "@/hooks/useRouteContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Plus, Check, Clock, X, CalendarCheck, PartyPopper, Download } from "lucide-react";
import { ExportDialog } from "@/components/ExportDialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { PaginationControls, usePagination } from "@/components/Pagination";

type StatusSessao = "presente" | "ausente" | "reagendado";

interface DiscipuloOption {
  id: string;
  visitante_nome: string;
  licoes_concluidas: number;
  progresso_percentual: number;
}

interface LicaoStatus {
  numero: number;
  concluida: boolean;
  data_conclusao: string | null;
}

interface Relatorio {
  id: string;
  discipulo_id: string;
  licao_numero: number;
  observacoes: string;
  status_sessao: StatusSessao;
  data_hora: string;
  criado_em: string;
  visitante_nome?: string;
  discipulador_nome?: string;
}

const statusSessaoConfig: Record<StatusSessao, { label: string; icon: React.ReactNode; color: string }> = {
  presente: { label: "Presente", icon: <Check className="h-3 w-3" />, color: "bg-success text-success-foreground" },
  ausente: { label: "Ausente", icon: <X className="h-3 w-3" />, color: "bg-destructive text-destructive-foreground" },
  reagendado: { label: "Reagendado", icon: <Clock className="h-3 w-3" />, color: "bg-warning text-warning-foreground" },
};

export default function Relatorios() {
  const { user } = useAuth();
  const { userRole } = usePermissions();
  const { congIds, isContextual } = useRouteContext();
  const [showForm, setShowForm] = useState(false);
  const [discipulos, setDiscipulos] = useState<DiscipuloOption[]>([]);
  const [selectedDiscipulo, setSelectedDiscipulo] = useState("");
  const [licoes, setLicoes] = useState<LicaoStatus[]>([]);
  const [selectedLicao, setSelectedLicao] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [statusSessao, setStatusSessao] = useState<StatusSessao>("presente");
  const [dataHora, setDataHora] = useState(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [filterDiscipulo, setFilterDiscipulo] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showFormado, setShowFormado] = useState(false);
  const [formadoNome, setFormadoNome] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetchDiscipulos = useCallback(async () => {
    let query = supabase
      .from("discipulos")
      .select("id, licoes_concluidas, progresso_percentual, congregacao_id, visitantes(nome)")
      .order("data_inicio", { ascending: false });

    if (congIds && congIds.length > 0) {
      query = query.in("congregacao_id", congIds);
    } else if (congIds && congIds.length === 0) {
      setDiscipulos([]);
      return;
    }

    const { data, error } = await query;
    if (!error && data) {
      setDiscipulos(data.map((d: any) => ({
        id: d.id,
        visitante_nome: d.visitantes?.nome || "Sem nome",
        licoes_concluidas: d.licoes_concluidas,
        progresso_percentual: d.progresso_percentual,
      })));
    }
  }, [congIds]);

  const fetchRelatorios = useCallback(async () => {
    setLoading(true);

    // Get discipulo IDs to filter relatorios
    const discipuloIds = discipulos.map(d => d.id);

    let query = supabase
      .from("relatorios")
      .select("*")
      .order("data_hora", { ascending: false });

    if (isContextual && discipuloIds.length > 0) {
      query = query.in("discipulo_id", discipuloIds);
    } else if (isContextual && discipuloIds.length === 0) {
      setRelatorios([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;
    if (!error && data) {
      const enriched = data.map((r: any) => {
        const disc = discipulos.find(d => d.id === r.discipulo_id);
        return { ...r, visitante_nome: disc?.visitante_nome || "—" };
      });
      setRelatorios(enriched);
    }
    setLoading(false);
  }, [discipulos, isContextual]);

  const fetchLicoes = useCallback(async (discipuloId: string) => {
    const { data } = await supabase
      .from("licoes")
      .select("numero, concluida, data_conclusao")
      .eq("discipulo_id", discipuloId)
      .order("numero");
    if (data) setLicoes(data);
  }, []);

  useEffect(() => { fetchDiscipulos(); }, [fetchDiscipulos]);
  useEffect(() => { if (discipulos.length > 0 || isContextual) fetchRelatorios(); }, [discipulos, fetchRelatorios, isContextual]);
  useEffect(() => {
    if (selectedDiscipulo) {
      fetchLicoes(selectedDiscipulo);
      setSelectedLicao(null);
    }
  }, [selectedDiscipulo, fetchLicoes]);

  const handleSave = async () => {
    if (!selectedDiscipulo || selectedLicao === null || !observacoes.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("relatorios")
        .select("id")
        .eq("discipulo_id", selectedDiscipulo)
        .eq("licao_numero", selectedLicao)
        .maybeSingle();

      if (existing) {
        toast.error(`Lição ${String(selectedLicao).padStart(2, "0")} já foi registrada para este discípulo.`);
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from("relatorios").insert({
        discipulo_id: selectedDiscipulo,
        discipulador_id: user!.id,
        licao_numero: selectedLicao,
        observacoes: observacoes.trim(),
        status_sessao: statusSessao,
        data_hora: new Date(dataHora).toISOString(),
      });
      if (insertError) throw insertError;

      if (statusSessao === "presente") {
        await supabase
          .from("licoes")
          .update({ concluida: true, data_conclusao: new Date().toISOString() })
          .eq("discipulo_id", selectedDiscipulo)
          .eq("numero", selectedLicao);
      }

      toast.success("Relatório salvo com sucesso!");

      if (statusSessao === "presente" && selectedLicao === 13) {
        const disc = discipulos.find(d => d.id === selectedDiscipulo);
        setFormadoNome(disc?.visitante_nome || "Discípulo");
        setShowFormado(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }

      setShowForm(false);
      setSelectedDiscipulo("");
      setSelectedLicao(null);
      setObservacoes("");
      setStatusSessao("presente");
      setDataHora(new Date().toISOString().slice(0, 16));
      fetchDiscipulos();
      fetchRelatorios();
    } catch (err: any) {
      toast.error("Erro ao salvar relatório: " + (err.message || ""));
    }
    setSaving(false);
  };

  const filteredRelatorios = filterDiscipulo === "all"
    ? relatorios
    : relatorios.filter(r => r.discipulo_id === filterDiscipulo);

  const { paginate, totalPages } = usePagination(filteredRelatorios);
  const paginatedRelatorios = paginate(page);
  useEffect(() => { setPage(1); }, [filterDiscipulo]);

  const progressDiscipulo = filterDiscipulo !== "all"
    ? discipulos.find(d => d.id === filterDiscipulo)
    : null;
  const progressLicoes = filterDiscipulo !== "all" ? licoes : [];

  useEffect(() => {
    if (filterDiscipulo !== "all") fetchLicoes(filterDiscipulo);
  }, [filterDiscipulo, fetchLicoes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <Badge variant="secondary" className="text-xs">{relatorios.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Relatório
          </Button>
        </div>
      </div>

      {/* FORM DIALOG */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Novo Relatório de Sessão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Discípulo *</label>
              <Select value={selectedDiscipulo} onValueChange={setSelectedDiscipulo}>
                <SelectTrigger><SelectValue placeholder="Selecione o discípulo" /></SelectTrigger>
                <SelectContent>
                  {discipulos.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.visitante_nome} ({d.licoes_concluidas}/13)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDiscipulo && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lição *</label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 13 }, (_, i) => i + 1).map(num => {
                    const licao = licoes.find(l => l.numero === num);
                    const done = licao?.concluida || false;
                    const isSelected = selectedLicao === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedLicao(num)}
                        className={`h-10 w-full rounded-lg text-sm font-semibold transition-all border
                          ${done
                            ? "bg-success/20 text-success border-success/40"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40"
                          }
                          ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                        `}
                      >
                        {String(num).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
                {selectedLicao && licoes.find(l => l.numero === selectedLicao)?.concluida && (
                  <p className="text-xs text-warning">⚠️ Esta lição já foi concluída anteriormente.</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status da Sessão *</label>
              <div className="flex gap-2">
                {(["presente", "ausente", "reagendado"] as StatusSessao[]).map(s => {
                  const cfg = statusSessaoConfig[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusSessao(s)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border
                        ${statusSessao === s
                          ? `${cfg.color} border-transparent`
                          : "bg-card text-muted-foreground border-border hover:border-primary/30"
                        }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Observações *</label>
              <Textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Descreva como foi a sessão de discipulado..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Data e Hora</label>
              <Input
                type="datetime-local"
                value={dataHora}
                onChange={e => setDataHora(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar Relatório"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FILTER */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Filtrar por discípulo</label>
          <Select value={filterDiscipulo} onValueChange={setFilterDiscipulo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {discipulos.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.visitante_nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PROGRESS VISUAL */}
      {progressDiscipulo && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Progresso — {progressDiscipulo.visitante_nome}</span>
              <Badge variant="secondary" className="text-sm font-bold">{progressDiscipulo.progresso_percentual}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 13 }, (_, i) => i + 1).map(num => {
                const l = progressLicoes.find(x => x.numero === num);
                const done = l?.concluida || false;
                return (
                  <div key={num} className="flex flex-col items-center gap-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${done
                        ? "bg-success text-success-foreground border-success"
                        : "bg-card text-muted-foreground border-border"
                      }`}>
                      {String(num).padStart(2, "0")}
                    </div>
                    {done && l?.data_conclusao && (
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(l.data_conclusao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTING */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRelatorios.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum relatório encontrado.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedRelatorios.map(r => {
              const cfg = statusSessaoConfig[r.status_sessao as StatusSessao] || statusSessaoConfig.presente;
              return (
                <Card key={r.id} className="border-border">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground text-sm">{r.visitante_nome}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5">Lição {String(r.licao_numero).padStart(2, "0")}</Badge>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.observacoes}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(r.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        {" "}
                        {new Date(r.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        tipo="relatorios"
        data={relatorios}
        sheetName="Relatórios"
        discipuladores={[...new Set(discipulos.map(d => d.visitante_nome))]}
        filterFn={(row, f) => {
          if (f.start && row.data_hora < f.start) return false;
          if (f.end && row.data_hora > f.end + "T23:59:59") return false;
          return true;
        }}
        transformFn={(r) => ({
          Discípulo: r.visitante_nome || "—",
          Lição: String(r.licao_numero).padStart(2, "0"),
          "Data/Hora": new Date(r.data_hora).toLocaleString("pt-BR"),
          "Status Sessão": r.status_sessao,
          Observações: r.observacoes,
        })}
      />

      {/* FORMADO MODAL */}
      <Dialog open={showFormado} onOpenChange={setShowFormado}>
        <DialogContent className="text-center max-w-sm">
          <div className="flex flex-col items-center gap-4 py-4">
            <PartyPopper className="h-16 w-16 text-warning" />
            <h2 className="text-xl font-bold text-foreground">Parabéns! 🎉</h2>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{formadoNome}</span> concluiu o discipulado!
            </p>
            <Button onClick={() => { setShowFormado(false); window.location.href = "/app/mapa-gcs"; }}>
              Vincular a um GC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
