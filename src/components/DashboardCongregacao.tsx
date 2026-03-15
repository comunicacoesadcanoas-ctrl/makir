import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, BookOpen, GraduationCap, TrendingUp, ArrowLeft,
  MapPin, Clock, UserCheck, AlertTriangle, Printer, UserPlus, Plus
} from "lucide-react";
import { exportDashboardPDF } from "@/lib/export-utils";
import { VisitanteFormDialog } from "@/components/VisitanteFormDialog";
import { NovoDiscipuloDialog } from "@/components/NovoDiscipuloDialog";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface Props {
  congregacaoId?: string;
}

export default function DashboardCongregacao({ congregacaoId: propCongId }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const { profile } = useAuth();
  const congregacaoId = propCongId || params.congId || profile?.congregacao_id;

  const [congregacao, setCongregacao] = useState<any>(null);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisitanteDialog, setShowVisitanteDialog] = useState(false);
  const [showDiscipuloDialog, setShowDiscipuloDialog] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!congregacaoId) return;
    setLoading(true);
    const [cRes, vRes, dRes] = await Promise.all([
      supabase.from("congregacoes").select("*, distritos(nome, numero)").eq("id", congregacaoId).single(),
      supabase.from("visitantes").select("*").eq("congregacao_id", congregacaoId).order("criado_em", { ascending: false }),
      supabase.from("discipulos").select("*, visitantes(nome)").eq("congregacao_id", congregacaoId).order("data_inicio", { ascending: false }),
    ]);
    setCongregacao(cRes.data);
    setVisitantes(vRes.data || []);
    setDiscipulos((dRes.data as any[]) || []);
    setLoading(false);
  }, [congregacaoId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visitantesVermelhos = visitantes.filter(v => v.status_cor === "vermelho");
  const visitantesAmarelos = visitantes.filter(v => v.status_cor === "amarelo");
  const visitantesVerdes = visitantes.filter(v => v.status_cor === "verde");
  const discipulosAtivos = discipulos.filter(d => d.status_cor !== "vermelho" || d.licoes_concluidas > 0);
  const discipulosFormados = discipulos.filter(d => d.licoes_concluidas >= 13);

  const visitantesPorMes = useMemo(() => {
    const months: { name: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      const count = visitantes.filter(v => v.criado_em?.slice(0, 7) === key).length;
      months.push({ name: label, count });
    }
    return months;
  }, [visitantes]);

  const isFromRoute = !!params.congId;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!congregacao) {
    return <div className="text-center py-20 text-muted-foreground">Congregação não encontrada.</div>;
  }

  return (
    <div className="space-y-6" id="dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isFromRoute && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{congregacao.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Distrito {congregacao.distritos?.numero} — {congregacao.distritos?.nome}
              {congregacao.pastor && ` · Pr. ${congregacao.pastor}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => setShowVisitanteDialog(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" /> Visitante
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDiscipuloDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Discípulo
          </Button>
          <Button variant="outline" size="sm" onClick={exportDashboardPDF} className="gap-1.5">
            <Printer className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Visitantes" value={visitantes.length} desc="total" />
        <StatCard icon={Clock} label="Aguardando" value={visitantesAmarelos.length} desc="quer discipulado" accent="warning" />
        <StatCard icon={BookOpen} label="Discípulos" value={discipulosAtivos.length} desc="ativos" />
        <StatCard icon={GraduationCap} label="Formados" value={discipulosFormados.length} desc="13 lições" accent="success" />
      </div>

      {/* Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Novos visitantes (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={visitantesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Visitantes" stroke="hsl(207, 62%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="visitantes">
        <TabsList>
          <TabsTrigger value="visitantes" className="gap-1.5">
            Visitantes
            <Badge variant="secondary" className="text-[10px] px-1.5">{visitantes.filter(v => v.status_cor !== "verde").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="discipulado" className="gap-1.5">
            Discipulado
            <Badge variant="secondary" className="text-[10px] px-1.5">{discipulos.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitantes" className="mt-4 space-y-2">
          {visitantes.filter(v => v.status_cor !== "verde").length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-8 text-center text-muted-foreground">Nenhum visitante pendente.</CardContent>
            </Card>
          ) : (
            visitantes.filter(v => v.status_cor !== "verde").slice(0, 20).map(v => {
              const statusColors: Record<string, string> = {
                vermelho: "bg-destructive",
                amarelo: "bg-warning",
                verde: "bg-success",
              };
              return (
                <Card key={v.id} className="border-border">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full shrink-0 ${statusColors[v.status_cor] || "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{v.nome}</p>
                        <p className="text-xs text-muted-foreground">{v.telefone} · {new Date(v.criado_em).toLocaleDateString("pt-BR")}</p>
                      </div>
                      {v.quer_discipulado && <Badge variant="outline" className="text-[10px]">Quer discipulado</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="discipulado" className="mt-4 space-y-2">
          {discipulos.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-8 text-center text-muted-foreground">Nenhum discípulo registrado.</CardContent>
            </Card>
          ) : (
            discipulos.slice(0, 20).map(d => (
              <Card key={d.id} className="border-border">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${
                      d.status_cor === "verde" ? "bg-success" : d.status_cor === "amarelo" ? "bg-warning" : "bg-destructive"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{d.visitantes?.nome || "—"}</p>
                      <p className="text-xs text-muted-foreground">por {d.discipulador_nome}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{d.licoes_concluidas}/13</span>
                      <Progress value={d.progresso_percentual} className="h-2 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, desc, accent }: {
  icon: React.ElementType; label: string; value: number | string; desc: string; accent?: string;
}) {
  const accentColor = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-secondary";
  return (
    <Card className="border-border">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accentColor}`} />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </CardContent>
    </Card>
  );
}
