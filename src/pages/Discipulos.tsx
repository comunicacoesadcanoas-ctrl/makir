import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useCongregacoes } from "@/hooks/useCongregacoes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Download, Plus, UserCog } from "lucide-react";
import { ExportDialog } from "@/components/ExportDialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DiscipuloDetailDialog } from "@/components/DiscipuloDetailDialog";
import { PaginationControls, usePagination } from "@/components/Pagination";
import { NovoDiscipuloDialog } from "@/components/NovoDiscipuloDialog";
import { NovoDiscipuladorDialog } from "@/components/NovoDiscipuladorDialog";

interface DiscipuloWithVisitante {
  id: string;
  visitante_id: string;
  discipulador_id: string;
  discipulador_nome: string;
  progresso_percentual: number;
  licoes_concluidas: number;
  data_inicio: string;
  status_cor: string;
  ultima_atividade: string | null;
  visitantes: {
    nome: string;
    telefone: string;
    cidade: string | null;
    
    aceitou_jesus: boolean;
    frequenta_igreja: boolean;
    quer_gc: boolean;
    quer_discipulado: boolean;
    estado_civil: string | null;
    sexo: string | null;
    endereco: string | null;
    observacoes: string | null;
    ano: string | null;
    criado_em: string;
  } | null;
}

const statusColors: Record<string, { bg: string; ring: string; label: string }> = {
  vermelho: { bg: "bg-destructive", ring: "ring-destructive/30", label: "Sem lições" },
  amarelo: { bg: "bg-warning", ring: "ring-warning/30", label: "Inativo >15 dias" },
  verde: { bg: "bg-success", ring: "ring-success/30", label: "Ativo" },
};

export default function Discipulos() {
  const { userRole, isAdmin } = usePermissions();
  const { congregacoes, distritos } = useCongregacoes();
  const [discipulos, setDiscipulos] = useState<DiscipuloWithVisitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [congregacaoFilter, setCongregacaoFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [novoDiscipuloOpen, setNovoDiscipuloOpen] = useState(false);
  const [novoDiscipuladorOpen, setNovoDiscipuladorOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetchDiscipulos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discipulos")
      .select("*, visitantes(nome, telefone, cidade, aceitou_jesus, frequenta_igreja, quer_gc, quer_discipulado, estado_civil, sexo, endereco, observacoes, ano, criado_em, congregacao_id)")
      .order("data_inicio", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar discípulos");
      console.error(error);
    } else {
      setDiscipulos((data as unknown as DiscipuloWithVisitante[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDiscipulos(); }, [fetchDiscipulos]);

  const filtered = discipulos.filter((d) => {
    const nome = d.visitantes?.nome || "";
    const matchSearch = !search || nome.toLowerCase().includes(search.toLowerCase());
    const matchCong = congregacaoFilter === "all" || (d as any).congregacao_id === congregacaoFilter;
    return matchSearch && matchCong;
  });

  const { paginate, totalPages } = usePagination(filtered);
  const paginatedItems = paginate(page);
  useEffect(() => { setPage(1); }, [search, congregacaoFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Discípulos</h1>
          <Badge variant="secondary" className="text-xs">{discipulos.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNovoDiscipuladorOpen(true)} className="gap-1.5">
            <UserCog className="h-4 w-4" /> Novo Discipulador
          </Button>
          <Button size="sm" onClick={() => setNovoDiscipuloOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Discípulo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {(isAdmin || userRole === "lider_distrito") && congregacoes.length > 0 && (
          <Select value={congregacaoFilter} onValueChange={setCongregacaoFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Congregação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas congregações</SelectItem>
              {distritos.map(d => {
                const congs = congregacoes.filter(c => c.distrito_id === d.id);
                return congs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ));
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Nenhum discípulo encontrado." : "Nenhum discípulo registrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedItems.map((d) => {
              const nome = d.visitantes?.nome || "Sem nome";
              const status = statusColors[d.status_cor] || statusColors.vermelho;
              const initials = nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              const formattedDate = new Date(d.data_inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

              return (
                <Card
                  key={d.id}
                  className="border-border hover:border-secondary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(d.id)}
                >
                  <CardContent className="py-4 px-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full shrink-0 ring-2 ${status.bg} ${status.ring}`} />
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{nome}</p>
                        <p className="text-xs text-muted-foreground">por {d.discipulador_nome}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-foreground">{d.licoes_concluidas}/13</span>
                      </div>
                      <Progress value={d.progresso_percentual} className="h-2" />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Início: {formattedDate}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {selectedId && (
        <DiscipuloDetailDialog
          open={!!selectedId}
          onOpenChange={() => setSelectedId(null)}
          discipuloId={selectedId}
          onUpdate={fetchDiscipulos}
        />
      )}

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        tipo="discipulos"
        data={discipulos}
        sheetName="Discípulos"
        showStatusFilter
        discipuladores={[...new Set(discipulos.map(d => d.discipulador_nome))]}
        filterFn={(row, f) => {
          if (f.status !== "all" && row.status_cor !== f.status) return false;
          if (f.discipulador !== "all" && row.discipulador_nome !== f.discipulador) return false;
          if (f.start && row.data_inicio < f.start) return false;
          if (f.end && row.data_inicio > f.end + "T23:59:59") return false;
          return true;
        }}
        transformFn={(d) => ({
          Nome: d.visitantes?.nome || "—",
          Discipulador: d.discipulador_nome,
          "Lições Concluídas": d.licoes_concluidas,
          "Progresso %": d.progresso_percentual,
          "Data Início": new Date(d.data_inicio).toLocaleDateString("pt-BR"),
          "Última Atividade": d.ultima_atividade ? new Date(d.ultima_atividade).toLocaleDateString("pt-BR") : "—",
          Status: d.status_cor,
        })}
      />

      <NovoDiscipuloDialog open={novoDiscipuloOpen} onOpenChange={setNovoDiscipuloOpen} onSuccess={fetchDiscipulos} />
      <NovoDiscipuladorDialog open={novoDiscipuladorOpen} onOpenChange={setNovoDiscipuladorOpen} onSuccess={fetchDiscipulos} />
    </div>
  );
}
