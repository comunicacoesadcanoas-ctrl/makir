import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, MapPin, GraduationCap, TrendingUp,
  Printer, ChevronRight, Church, UserPlus, Plus
} from "lucide-react";
import { exportDashboardPDF } from "@/lib/export-utils";
import { VisitanteFormDialog } from "@/components/VisitanteFormDialog";
import { NovoDiscipuloDialog } from "@/components/NovoDiscipuloDialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

const COLORS = [
  "hsl(80, 65%, 50%)", "hsl(207, 62%, 45%)", "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 50%, 50%)",
  "hsl(180, 50%, 40%)", "hsl(320, 50%, 50%)", "hsl(45, 80%, 50%)",
  "hsl(120, 40%, 45%)", "hsl(200, 60%, 50%)", "hsl(350, 60%, 50%)"
];

interface DistritoData {
  id: string;
  numero: number;
  nome: string;
  totalCongregacoes: number;
  totalGCs: number;
  totalVisitantes: number;
  totalDiscipulos: number;
}

export default function DashboardGeral() {
  const navigate = useNavigate();
  const [distritos, setDistritos] = useState<any[]>([]);
  const [congregacoes, setCongregacoes] = useState<any[]>([]);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [gcs, setGcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisitanteDialog, setShowVisitanteDialog] = useState(false);
  const [showDiscipuloDialog, setShowDiscipuloDialog] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [dRes, cRes, vRes, disRes, gRes] = await Promise.all([
      supabase.from("distritos").select("*").order("numero"),
      supabase.from("congregacoes").select("*"),
      supabase.from("visitantes").select("id, status_cor, congregacao_id, criado_em"),
      supabase.from("discipulos").select("id, status_cor, congregacao_id, licoes_concluidas"),
      supabase.from("grupos_crescimento").select("id, status_gc, total_membros, congregacao_id"),
    ]);
    setDistritos(dRes.data || []);
    setCongregacoes(cRes.data || []);
    setVisitantes(vRes.data || []);
    setDiscipulos(disRes.data || []);
    setGcs(gRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const distritosData: DistritoData[] = useMemo(() => {
    return distritos.map(d => {
      const congs = congregacoes.filter(c => c.distrito_id === d.id);
      const congIds = new Set(congs.map(c => c.id));
      return {
        id: d.id,
        numero: d.numero,
        nome: d.nome,
        totalCongregacoes: congs.length,
        totalGCs: gcs.filter(g => g.congregacao_id && congIds.has(g.congregacao_id)).length,
        totalVisitantes: visitantes.filter(v => congIds.has(v.congregacao_id)).length,
        totalDiscipulos: discipulos.filter(di => congIds.has(di.congregacao_id)).length,
      };
    });
  }, [distritos, congregacoes, visitantes, discipulos, gcs]);

  const totalVisitantes = visitantes.length;
  const totalDiscipulos = discipulos.length;
  const totalFormados = discipulos.filter(d => d.licoes_concluidas >= 13).length;
  const totalGcsAtivos = gcs.filter(g => g.status_gc === "ativo").length;
  const totalMembrosGC = gcs.reduce((s, g) => s + (g.total_membros || 0), 0);

  const chartData = distritosData.map(d => ({
    name: `Dist. ${d.numero}`,
    value: d.totalVisitantes + d.totalDiscipulos,
  })).filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" id="dashboard-content">
      {/* Action buttons */}
      <div className="flex items-center gap-2 no-print">
        <Button onClick={() => setShowVisitanteDialog(true)} size="sm" className="gap-1.5 rounded-2xl">
          <UserPlus className="h-4 w-4" /> Visitante
        </Button>
        <Button variant="outline" onClick={() => setShowDiscipuloDialog(true)} size="sm" className="gap-1.5 rounded-2xl">
          <Plus className="h-4 w-4" /> Discípulo
        </Button>
        <Button variant="ghost" size="sm" onClick={exportDashboardPDF} className="gap-1.5 rounded-2xl ml-auto">
          <Printer className="h-4 w-4" /> PDF
        </Button>
      </div>

      {/* Bento grid — stats + chart */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Stat cards */}
        <StatCard icon={Users} label="Visitantes" value={totalVisitantes} desc="total cadastrados" className="lg:col-span-3" />
        <StatCard icon={BookOpen} label="Discípulos" value={totalDiscipulos} desc="em acompanhamento" className="lg:col-span-3" />
        <StatCard icon={GraduationCap} label="Formados" value={totalFormados} desc="13 lições concluídas" accent="success" className="lg:col-span-2" />
        <StatCard icon={MapPin} label="GCs Ativos" value={totalGcsAtivos} desc="em funcionamento" accent="success" className="lg:col-span-2" />
        <StatCard icon={TrendingUp} label="Membros GC" value={totalMembrosGC} desc="participando" className="lg:col-span-2" />
      </div>

      {/* Chart + quick actions row */}
      {chartData.length > 0 && (
        <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição por Distrito</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  strokeWidth={3}
                  stroke="hsl(var(--card))"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distrito Cards */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distritos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {distritosData.map(d => (
            <Card
              key={d.id}
              className="rounded-3xl border-border/60 shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-200 cursor-pointer group"
              onClick={() => navigate(`/app/distrito/${d.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Church className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground text-sm">Distrito {d.numero}</span>
                      <p className="text-xs text-muted-foreground">{d.nome}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <MiniStat value={d.totalCongregacoes} label="Congregações" />
                  <MiniStat value={d.totalGCs} label="GCs" />
                  <MiniStat value={d.totalVisitantes} label="Visitantes" />
                  <MiniStat value={d.totalDiscipulos} label="Discípulos" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <VisitanteFormDialog open={showVisitanteDialog} onOpenChange={setShowVisitanteDialog} onSuccess={fetchAll} />
      <NovoDiscipuloDialog open={showDiscipuloDialog} onOpenChange={setShowDiscipuloDialog} onSuccess={fetchAll} />
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center bg-muted/50 rounded-2xl py-2.5 px-1">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, desc, accent, className = "" }: {
  icon: React.ElementType; label: string; value: number | string; desc: string; accent?: string; className?: string;
}) {
  const iconBg = accent === "success"
    ? "bg-success/10 text-success"
    : accent === "warning"
      ? "bg-warning/10 text-warning"
      : "bg-accent/10 text-accent";

  return (
    <Card className={`rounded-3xl border-border/60 shadow-sm ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-9 w-9 rounded-2xl ${iconBg} flex items-center justify-center`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground/70">{desc}</p>
      </CardContent>
    </Card>
  );
}
