import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Trash2, MapPin, Clock, Phone, UserPlus,
  CalendarCheck, BarChart3, Search
} from "lucide-react";
import { toast } from "sonner";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
const LIBRARIES: ("places")[] = ["places"];

interface GC {
  id: string;
  nome: string;
  lider_nome: string;
  lider_email: string | null;
  endereco: string | null;
  bairro: string | null;
  zona: string | null;
  latitude: number | null;
  longitude: number | null;
  dia_encontro: string[];
  horario: string | null;
  capacidade: number;
  total_membros: number;
  telefone_contato: string | null;
  status_gc: string;
  status_cor: string;
  observacoes: string | null;
  data_inicio: string | null;
}

interface Membro {
  id: string;
  nome: string;
  telefone: string | null;
  tipo_entrada: string;
  data_entrada: string;
  discipulo_id: string | null;
}

interface Frequencia {
  id: string;
  mes_referencia: string;
  presentes: number;
  observacoes: string | null;
  criado_em: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  gc: GC;
  onUpdate: () => void;
}

const miniMapStyle = { width: "100%", height: "200px", borderRadius: "0.5rem" };

const markerColors: Record<string, string> = {
  verde: "#22c55e",
  amarelo: "#eab308",
  vermelho: "#ef4444",
};

export default function GCDetailDialog({ open, onOpenChange, gc, onUpdate }: Props) {
  const { isAdmin } = usePermissions();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);
  const [tab, setTab] = useState("info");

  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "discipulo">("manual");
  const [manualNome, setManualNome] = useState("");
  const [manualTel, setManualTel] = useState("");
  const [discSearch, setDiscSearch] = useState("");
  const [discResults, setDiscResults] = useState<any[]>([]);
  const [savingMember, setSavingMember] = useState(false);

  // Frequency form states
  const [showFreqForm, setShowFreqForm] = useState(false);
  const [freqMes, setFreqMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [freqPresentes, setFreqPresentes] = useState("");
  const [freqObs, setFreqObs] = useState("");
  const [savingFreq, setSavingFreq] = useState(false);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY, libraries: LIBRARIES });

  const fetchMembros = useCallback(async () => {
    const { data } = await supabase
      .from("membros_gc")
      .select("*")
      .eq("gc_id", gc.id)
      .order("data_entrada", { ascending: false });
    setMembros((data as any[]) || []);
  }, [gc.id]);

  const fetchFrequencias = useCallback(async () => {
    const { data } = await supabase
      .from("frequencia_gc")
      .select("*")
      .eq("gc_id", gc.id)
      .order("mes_referencia", { ascending: true });
    setFrequencias((data as any[]) || []);
  }, [gc.id]);

  useEffect(() => {
    if (open) {
      fetchMembros();
      fetchFrequencias();
    }
  }, [open, fetchMembros, fetchFrequencias]);

  // Search formed disciples (13 lessons completed)
  const searchDiscipulos = async (q: string) => {
    setDiscSearch(q);
    if (q.length < 2) { setDiscResults([]); return; }
    const { data } = await supabase
      .from("discipulos")
      .select("id, discipulador_nome, licoes_concluidas, visitante_id, visitantes:visitante_id(nome, telefone)")
      .eq("licoes_concluidas", 13)
      .limit(10);
    const filtered = (data || []).filter((d: any) =>
      d.visitantes?.nome?.toLowerCase().includes(q.toLowerCase())
    );
    setDiscResults(filtered);
  };

  const addManualMember = async () => {
    if (!manualNome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSavingMember(true);
    const { error } = await supabase.from("membros_gc").insert({
      gc_id: gc.id,
      nome: manualNome.trim(),
      telefone: manualTel.trim() || null,
      tipo_entrada: "manual",
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Membro adicionado!"); setManualNome(""); setManualTel(""); setShowAddMember(false); fetchMembros(); onUpdate(); }
    setSavingMember(false);
  };

  const addDiscipuloMember = async (disc: any) => {
    setSavingMember(true);
    const { error } = await supabase.from("membros_gc").insert({
      gc_id: gc.id,
      nome: disc.visitantes?.nome || "—",
      telefone: disc.visitantes?.telefone || null,
      discipulo_id: disc.id,
      tipo_entrada: "visitante_convertido",
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Discípulo vinculado!"); setDiscSearch(""); setDiscResults([]); setShowAddMember(false); fetchMembros(); onUpdate(); }
    setSavingMember(false);
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remover este membro?")) return;
    const { error } = await supabase.from("membros_gc").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Membro removido"); fetchMembros(); onUpdate(); }
  };

  const saveFrequencia = async () => {
    if (!freqMes || !freqPresentes) { toast.error("Preencha mês e presentes"); return; }
    setSavingFreq(true);
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("frequencia_gc").upsert({
      gc_id: gc.id,
      mes_referencia: freqMes,
      presentes: parseInt(freqPresentes) || 0,
      observacoes: freqObs.trim() || null,
      registrado_por: user?.id || "",
    }, { onConflict: "gc_id,mes_referencia" });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Frequência registrada!"); setShowFreqForm(false); setFreqObs(""); fetchFrequencias(); }
    setSavingFreq(false);
  };

  const chartData = frequencias.map(f => ({
    mes: f.mes_referencia,
    presentes: f.presentes,
  }));

  const chartConfig = {
    presentes: { label: "Presentes", color: "hsl(var(--primary))" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {gc.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="membros">Membros ({membros.length})</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          </TabsList>

          {/* INFO TAB */}
          <TabsContent value="info" className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Líder:</span> <span className="font-medium">{gc.lider_nome}</span></div>
              {gc.lider_email && <div><span className="text-muted-foreground">Email:</span> {gc.lider_email}</div>}
              {gc.telefone_contato && <div><span className="text-muted-foreground">Telefone:</span> {gc.telefone_contato}</div>}
              {gc.bairro && <div><span className="text-muted-foreground">Bairro:</span> {gc.bairro}{gc.zona ? ` — ${gc.zona}` : ""}</div>}
              {gc.endereco && <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {gc.endereco}</div>}
              {gc.dia_encontro?.length > 0 && (
                <div><span className="text-muted-foreground">Encontros:</span> {gc.dia_encontro.join(", ")}{gc.horario ? ` às ${gc.horario}` : ""}</div>
              )}
              <div><span className="text-muted-foreground">Membros:</span> {gc.total_membros}/{gc.capacidade}</div>
              {gc.data_inicio && <div><span className="text-muted-foreground">Início:</span> {new Date(gc.data_inicio).toLocaleDateString("pt-BR")}</div>}
              {gc.observacoes && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> {gc.observacoes}</div>}
            </div>

            {/* Mini map */}
            {isLoaded && gc.latitude && gc.longitude && (
              <div className="rounded-lg overflow-hidden border border-border">
                <GoogleMap mapContainerStyle={miniMapStyle} center={{ lat: gc.latitude, lng: gc.longitude }} zoom={15}>
                  <Marker
                    position={{ lat: gc.latitude, lng: gc.longitude }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE, scale: 12,
                      fillColor: markerColors[gc.status_cor] || markerColors.verde,
                      fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff",
                    }}
                  />
                </GoogleMap>
              </div>
            )}
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="membros" className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{membros.length} membro(s)</span>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowAddMember(true)} className="gap-1.5">
                  <UserPlus className="h-4 w-4" /> Adicionar
                </Button>
              )}
            </div>

            {membros.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Nenhum membro cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {membros.map(m => (
                  <Card key={m.id} className="border-border">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{m.nome}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {m.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.telefone}</span>}
                          <Badge variant="outline" className="text-[10px]">
                            {m.tipo_entrada === "visitante_convertido" ? "Visitante convertido" : "Adicionado manualmente"}
                          </Badge>
                          <span>{new Date(m.data_entrada).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMember(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ADD MEMBER DIALOG */}
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" /> Adicionar Membro
                  </DialogTitle>
                </DialogHeader>
                <Tabs value={addMode} onValueChange={v => setAddMode(v as any)}>
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="discipulo">Discípulo formado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-3 mt-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                      <Input value={manualNome} onChange={e => setManualNome(e.target.value)} placeholder="Nome do membro" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                      <Input value={manualTel} onChange={e => setManualTel(e.target.value)} placeholder="(51) 99999-0000" />
                    </div>
                    <Button onClick={addManualMember} disabled={savingMember} className="w-full">
                      {savingMember ? "Salvando..." : "Adicionar"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="discipulo" className="space-y-3 mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar discípulo formado..."
                        value={discSearch}
                        onChange={e => searchDiscipulos(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {discResults.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {discResults.map(d => (
                          <button
                            key={d.id}
                            onClick={() => addDiscipuloMember(d)}
                            disabled={savingMember}
                            className="w-full text-left p-2 rounded-md hover:bg-accent text-sm border border-border"
                          >
                            <p className="font-medium">{d.visitantes?.nome}</p>
                            <p className="text-xs text-muted-foreground">Discipulador: {d.discipulador_nome} • 13 lições ✓</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {discSearch.length >= 2 && discResults.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">Nenhum discípulo formado encontrado.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* FREQUENCY TAB */}
          <TabsContent value="frequencia" className="space-y-4 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Histórico de frequência</span>
              <Button size="sm" onClick={() => setShowFreqForm(true)} className="gap-1.5">
                <CalendarCheck className="h-4 w-4" /> Registrar
              </Button>
            </div>

            {/* Growth chart */}
            {chartData.length > 1 ? (
              <Card className="border-border">
                <CardContent className="pt-4 pb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" /> Crescimento do GC
                  </p>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="presentes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : chartData.length === 1 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Registre mais meses para visualizar o gráfico de crescimento.</p>
            ) : null}

            {/* Frequency list */}
            {frequencias.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">Nenhuma frequência registrada.</p>
            ) : (
              <div className="space-y-2">
                {[...frequencias].reverse().map(f => (
                  <Card key={f.id} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{f.mes_referencia}</p>
                          {f.observacoes && <p className="text-xs text-muted-foreground mt-0.5">{f.observacoes}</p>}
                        </div>
                        <Badge variant="secondary">{f.presentes} presentes</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Frequency form dialog */}
            <Dialog open={showFreqForm} onOpenChange={setShowFreqForm}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" /> Registrar Frequência
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Mês de referência *</label>
                    <Input type="month" value={freqMes} onChange={e => setFreqMes(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Membros presentes *</label>
                    <Input type="number" min="0" value={freqPresentes} onChange={e => setFreqPresentes(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Observações do líder</label>
                    <Textarea value={freqObs} onChange={e => setFreqObs(e.target.value)} rows={2} />
                  </div>
                  <Button onClick={saveFrequencia} disabled={savingFreq} className="w-full">
                    {savingFreq ? "Salvando..." : "Salvar Frequência"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
