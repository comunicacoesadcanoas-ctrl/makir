import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, MapPin, UserCheck, UserX, Clock, GraduationCap,
  TrendingUp, AlertTriangle, LayoutDashboard, Printer
} from "lucide-react";
import { exportDashboardPDF } from "@/lib/export-utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type PeriodFilter = "today" | "week" | "month" | "year" | "custom";

function getDateRange(period: PeriodFilter, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      start = new Date(now); start.setHours(0, 0, 0, 0); break;
    case "week":
      start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1); break;
    case "custom":
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), 0, 1);
      end = customEnd ? new Date(customEnd + "T23:59:59.999") : end;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

const COLORS = [
  "hsl(215, 60%, 26%)", "hsl(207, 62%, 45%)", "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 50%, 50%)"
];

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [gcs, setGcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [vRes, dRes, gRes] = await Promise.all([
      supabase.from("visitantes").select("*"),
      supabase.from("discipulos").select("*, visitantes(nome)"),
      supabase.from("grupos_crescimento").select("*"),
    ]);
    setVisitantes(vRes.data || []);
    setDiscipulos(dRes.data || []);
    setGcs(gRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter helpers
  const inRange = (dateStr: string) => dateStr >= range.start && dateStr <= range.end;
  const todayStr = new Date().toISOString().slice(0, 10);

  // --- VISITANTES STATS ---
  const visitantesInRange = visitantes.filter(v => inRange(v.criado_em));
  const visitantesHoje = visitantes.filter(v => v.criado_em?.slice(0, 10) === todayStr);
  const visitantesAmarelos = visitantes.filter(v => v.status_cor === "amarelo");

  // --- DISCIPULOS STATS ---
  const discipulosAtivos = discipulos.filter(d => d.status_cor !== "vermelho" || d.licoes_concluidas > 0);
  const discipulosFormados = discipulos.filter(d => d.licoes_concluidas >= 13);
  const discipulosVerdes = discipulos.filter(d => d.status_cor === "verde");
  const discipulosVermelhos = discipulos.filter(d => d.status_cor === "vermelho");

  // --- GCS STATS ---
  const gcsAtivos = gcs.filter(g => g.status_gc === "ativo");
  const totalMembrosGC = gcs.reduce((s, g) => s + (g.total_membros || 0), 0);
  const gcsAtencao = gcs.filter(g => g.status_cor === "amarelo" || g.status_cor === "vermelho");

  // --- CHART: Novos visitantes por mês (last 12) ---
  const visitantesPorMes = useMemo(() => {
    const months: { name: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const count = visitantes.filter(v => v.criado_em?.slice(0, 7) === key).length;
      months.push({ name: label, count });
    }
    return months;
  }, [visitantes]);

  // --- CHART: Discípulos por discipulador ---
  const discipulosPorDiscipulador = useMemo(() => {
    const map: Record<string, number> = {};
    discipulos.forEach(d => {
      const nome = d.discipulador_nome || "Desconhecido";
      map[nome] = (map[nome] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [discipulos]);

  // --- CHART: Sexo ---
  const distSexo = useMemo(() => {
    const map: Record<string, number> = { masculino: 0, feminino: 0, "Não informado": 0 };
    visitantes.forEach(v => {
      if (v.sexo === "masculino") map.masculino++;
      else if (v.sexo === "feminino") map.feminino++;
      else map["Não informado"]++;
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [visitantes]);

  // --- CHART: Estado civil ---
  const distEstadoCivil = useMemo(() => {
    const map: Record<string, number> = {};
    visitantes.forEach(v => {
      const ec = v.estado_civil || "Não informado";
      map[ec] = (map[ec] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [visitantes]);

  // --- CHART: Top 5 bairros ---
  const topBairros = useMemo(() => {
    const map: Record<string, number> = {};
    visitantes.forEach(v => {
      if (v.cidade) map[v.cidade] = (map[v.cidade] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [visitantes]);

  // --- FUNNEL ---
  const funnel = useMemo(() => {
    const cadastrados = visitantes.length;
    const querDiscipulado = visitantes.filter(v => v.quer_discipulado).length;
    const emDiscipulado = discipulos.length;
    const formados = discipulosFormados.length;
    const membrosGC = totalMembrosGC;
    const steps = [
      { label: "Visitante cadastrado", value: cadastrados },
      { label: "Quer discipulado", value: querDiscipulado },
      { label: "Em discipulado", value: emDiscipulado },
      { label: "Discípulo formado", value: formados },
      { label: "Membro de GC", value: membrosGC },
    ];
    return steps.map((s, i) => ({
      ...s,
      pct: i === 0 ? 100 : steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : 0,
    }));
  }, [visitantes, discipulos, discipulosFormados, totalMembrosGC]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-content">
      {/* HEADER + FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={exportDashboardPDF} className="gap-1.5">
            <Printer className="h-4 w-4" /> Exportar PDF
          </Button>
          <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {period === "custom" && (
            <div className="flex gap-1.5">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-[130px] text-xs" />
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-[130px] text-xs" />
            </div>
          )}
        </div>
      </div>

      {/* ROW 1 - VISITANTES */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visitantes</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total" value={visitantes.length} desc="histórico" />
          <StatCard icon={TrendingUp} label="Novos hoje" value={visitantesHoje.length} desc={todayStr} />
          <StatCard icon={UserCheck} label="No período" value={visitantesInRange.length} desc="filtro atual" />
          <StatCard icon={Clock} label="Aguardando" value={visitantesAmarelos.length} desc="quer discipulado" accent="warning" />
        </div>
      </div>

      {/* ROW 2 - DISCIPULADO */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Discipulado</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={BookOpen} label="Ativos" value={discipulosAtivos.length} desc="em acompanhamento" />
          <StatCard icon={GraduationCap} label="Formados" value={discipulosFormados.length} desc="13 lições" accent="success" />
          <StatCard icon={UserCheck} label="Em progresso" value={discipulosVerdes.length} desc="verdes" accent="success" />
          <StatCard icon={UserX} label="Sem atividade" value={discipulosVermelhos.length} desc="vermelhos" accent="destructive" />
        </div>
      </div>

      {/* ROW 3 - GCS */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Grupos de Crescimento</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard icon={MapPin} label="GCs ativos" value={gcsAtivos.length} desc="funcionando" accent="success" />
          <StatCard icon={Users} label="Membros" value={totalMembrosGC} desc="total em GCs" />
          <StatCard icon={AlertTriangle} label="Com atenção" value={gcsAtencao.length} desc="amarelos/vermelhos" accent="warning" />
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visitantes por mês */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Novos visitantes por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
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

        {/* Discípulos por discipulador */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Discípulos por discipulador</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={discipulosPorDiscipulador}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Bar dataKey="value" name="Discípulos" fill="hsl(215, 60%, 26%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sexo */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por sexo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={distSexo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {distSexo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estado civil */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por estado civil</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={distEstadoCivil} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {distEstadoCivil.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top bairros */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 5 cidades / bairros</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topBairros} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Bar dataKey="value" name="Visitantes" fill="hsl(152, 60%, 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FUNNEL */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {funnel.map((step, i) => {
                const widthPct = Math.max(step.pct, 15);
                return (
                  <div key={step.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{step.label}</span>
                      <span className="text-muted-foreground">{step.value} {i > 0 ? `(${step.pct}%)` : ""}</span>
                    </div>
                    <div className="w-full bg-muted rounded-sm h-6 overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all flex items-center justify-center text-[10px] font-bold"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                          color: "white",
                        }}
                      >
                        {step.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Stat Card Component ---
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
