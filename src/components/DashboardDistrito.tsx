import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, BookOpen, GraduationCap, TrendingUp, ChevronRight,
  MapPin, ArrowLeft, Church, Printer, UserPlus, Plus
} from "lucide-react";
import { exportDashboardPDF } from "@/lib/export-utils";
import { VisitanteFormDialog } from "@/components/VisitanteFormDialog";
import { NovoDiscipuloDialog } from "@/components/NovoDiscipuloDialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface Props {
  distritoId?: string;
}

export default function DashboardDistrito({ distritoId: propDistritoId }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const { profile } = useAuth();
  const distritoId = propDistritoId || params.distritoId || profile?.distrito_id;

  const [distrito, setDistrito] = useState<any>(null);
  const [congregacoes, setCongregacoes] = useState<any[]>([]);
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisitanteDialog, setShowVisitanteDialog] = useState(false);
  const [showDiscipuloDialog, setShowDiscipuloDialog] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!distritoId) return;
    setLoading(true);
    const [dRes, cRes, vRes, disRes] = await Promise.all([
      supabase.from("distritos").select("*").eq("id", distritoId).single(),
      supabase.from("congregacoes").select("*").eq("distrito_id", distritoId).order("nome"),
      supabase.from("visitantes").select("id, status_cor, congregacao_id, criado_em"),
      supabase.from("discipulos").select("id, status_cor, congregacao_id, licoes_concluidas"),
    ]);
    setDistrito(dRes.data);
    const congs = cRes.data || [];
    setCongregacoes(congs);
    const congIds = new Set(congs.map((c: any) => c.id));
    setVisitantes((vRes.data || []).filter((v: any) => congIds.has(v.congregacao_id)));
    setDiscipulos((disRes.data || []).filter((d: any) => congIds.has(d.congregacao_id)));
    setLoading(false);
  }, [distritoId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const congData = useMemo(() => {
    return congregacoes.map(c => ({
      id: c.id,
      nome: c.nome,
      pastor: c.pastor,
      totalVisitantes: visitantes.filter(v => v.congregacao_id === c.id).length,
      totalDiscipulos: discipulos.filter(d => d.congregacao_id === c.id).length,
    }));
  }, [congregacoes, visitantes, discipulos]);

  const chartData = congData.map(c => ({
    name: c.nome.length > 12 ? c.nome.slice(0, 12) + "…" : c.nome,
    visitantes: c.totalVisitantes,
    discipulos: c.totalDiscipulos,
  }));

  const totalFormados = discipulos.filter(d => d.licoes_concluidas >= 13).length;
  const isFromRoute = !!params.distritoId;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!distrito) {
    return (
      <div className="text-center py-20 text-muted-foreground">Distrito não encontrado.</div>
    );
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
          <Church className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Distrito {distrito.numero}</h1>
            <p className="text-sm text-muted-foreground">{distrito.nome}</p>
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
        <StatCard icon={MapPin} label="Congregações" value={congregacoes.length} desc="neste distrito" />
        <StatCard icon={Users} label="Visitantes" value={visitantes.length} desc="total" />
        <StatCard icon={BookOpen} label="Discípulos" value={discipulos.length} desc="ativos" />
        <StatCard icon={GraduationCap} label="Formados" value={totalFormados} desc="13 lições" accent="success" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visão por Congregação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(215, 20%, 46%)" />
                <Tooltip />
                <Bar dataKey="visitantes" name="Visitantes" fill="hsl(207, 62%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discipulos" name="Discípulos" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Congregation Cards */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Congregações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {congData.map(c => (
            <Card
              key={c.id}
              className="border-border hover:border-secondary/40 transition-colors cursor-pointer group"
              onClick={() => navigate(`/app/congregacao/${c.id}`)}
            >
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{c.nome}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                </div>
                {c.pastor && <p className="text-xs text-muted-foreground mb-3">Pr. {c.pastor}</p>}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{c.totalVisitantes}</p>
                    <p className="text-[10px] text-muted-foreground">Visitantes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{c.totalDiscipulos}</p>
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
