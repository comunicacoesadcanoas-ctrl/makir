import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, MapPin, GraduationCap, TrendingUp, LayoutDashboard,
  Printer, ChevronRight, Church, UserPlus, Plus
} from "lucide-react";
import { exportDashboardPDF } from "@/lib/export-utils";
import { VisitanteFormDialog } from "@/components/VisitanteFormDialog";
import { NovoDiscipuloDialog } from "@/components/NovoDiscipuloDialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

const COLORS = [
  "hsl(215, 60%, 26%)", "hsl(207, 62%, 45%)", "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 50%, 50%)",
  "hsl(180, 50%, 40%)", "hsl(320, 50%, 50%)", "hsl(45, 80%, 50%)",
  "hsl(120, 40%, 45%)", "hsl(200, 60%, 50%)", "hsl(350, 60%, 50%)"
];

interface DistritoData {
  id: string;
  numero: number;
  nome: string;
  totalCongregacoes: number;
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
      supabase.from("grupos_crescimento").select("id, status_gc, total_membros"),
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
        totalVisitantes: visitantes.filter(v => congIds.has(v.congregacao_id)).length,
        totalDiscipulos: discipulos.filter(di => congIds.has(di.congregacao_id)).length,
      };
    });
  }, [distritos, congregacoes, visitantes, discipulos]);

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
    <div className="space-y-6" id="dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard Geral</h1>
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

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Visitantes" value={totalVisitantes} desc="total" />
        <StatCard icon={BookOpen} label="Discípulos" value={totalDiscipulos} desc="ativos" />
        <StatCard icon={GraduationCap} label="Formados" value={totalFormados} desc="13 lições" accent="success" />
        <StatCard icon={MapPin} label="GCs Ativos" value={totalGcsAtivos} desc="funcionando" accent="success" />
        <StatCard icon={TrendingUp} label="Membros GC" value={totalMembrosGC} desc="total" />
      </div>

      {/* Distribution chart */}
      {chartData.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Distrito</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
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
              className="border-border hover:border-secondary/40 transition-colors cursor-pointer group"
              onClick={() => navigate(`/app/distrito/${d.id}`)}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Church className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Distrito {d.numero}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{d.nome}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{d.totalCongregacoes}</p>
                    <p className="text-[10px] text-muted-foreground">Congregações</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{d.totalVisitantes}</p>
                    <p className="text-[10px] text-muted-foreground">Visitantes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{d.totalDiscipulos}</p>
                    <p className="text-[10px] text-muted-foreground">Discípulos</p>
                  </div>
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

function StatCard({ icon: Icon, label, value, desc, accent }: {
  icon: React.ElementType; label: string; value: number | string; desc: string; accent?: string;
}) {
  const accentColor = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : accent === "destructive" ? "text-destructive" : "text-secondary";
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
