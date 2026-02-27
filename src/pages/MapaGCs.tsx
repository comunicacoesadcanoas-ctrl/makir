import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Users, Clock, Phone, Pencil, Trash2, Search, Map, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const GOOGLE_MAPS_KEY = "AIzaSyBsRrFlYOT5_NClqnQYnw1rv2Zr60slr9Q";

type StatusGC = "ativo" | "em_formacao" | "inativo";

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
  status_gc: StatusGC;
  status_cor: string;
  observacoes: string | null;
  data_inicio: string | null;
}

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const statusGCConfig: Record<StatusGC, { label: string; cor: string }> = {
  ativo: { label: "Ativo", cor: "bg-success text-success-foreground" },
  em_formacao: { label: "Em formação", cor: "bg-warning text-warning-foreground" },
  inativo: { label: "Inativo", cor: "bg-destructive text-destructive-foreground" },
};

const statusCorConfig: Record<string, { bg: string; ring: string }> = {
  verde: { bg: "bg-success", ring: "ring-success/30" },
  amarelo: { bg: "bg-warning", ring: "ring-warning/30" },
  vermelho: { bg: "bg-destructive", ring: "ring-destructive/30" },
};

const markerColors: Record<string, string> = {
  verde: "#22c55e",
  amarelo: "#eab308",
  vermelho: "#ef4444",
};

const emptyForm = {
  nome: "",
  lider_nome: "",
  lider_email: "",
  endereco: "",
  bairro: "",
  zona: "",
  dia_encontro: [] as string[],
  horario: "",
  capacidade: "20",
  total_membros: "0",
  telefone_contato: "",
  status_gc: "ativo" as StatusGC,
  observacoes: "",
  data_inicio: new Date().toISOString().slice(0, 10),
};

const mapContainerStyle = { width: "100%", height: "500px", borderRadius: "0.5rem" };
const defaultCenter = { lat: -29.9167, lng: -51.1833 }; // Canoas, RS

export default function MapaGCs() {
  const { isAdmin } = usePermissions();
  const [gcs, setGcs] = useState<GC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("cards");
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY });

  const fetchGcs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grupos_crescimento")
      .select("*")
      .order("nome");
    if (error) toast.error("Erro ao carregar GCs");
    else setGcs((data as unknown as GC[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGcs(); }, [fetchGcs]);

  const openNew = () => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true); };

  const openEdit = (gc: GC) => {
    setEditingId(gc.id);
    setForm({
      nome: gc.nome, lider_nome: gc.lider_nome, lider_email: gc.lider_email || "",
      endereco: gc.endereco || "", bairro: gc.bairro || "", zona: gc.zona || "",
      dia_encontro: gc.dia_encontro || [], horario: gc.horario || "",
      capacidade: String(gc.capacidade), total_membros: String(gc.total_membros),
      telefone_contato: gc.telefone_contato || "", status_gc: gc.status_gc,
      observacoes: gc.observacoes || "", data_inicio: gc.data_inicio || new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este GC?")) return;
    const { error } = await supabase.from("grupos_crescimento").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("GC excluído"); fetchGcs(); }
  };

  const toggleDia = (dia: string) => {
    setForm(f => ({
      ...f,
      dia_encontro: f.dia_encontro.includes(dia)
        ? f.dia_encontro.filter(d => d !== dia)
        : [...f.dia_encontro, dia],
    }));
  };

  const computeStatusCor = (status_gc: StatusGC, total: number, capacidade: number): string => {
    if (status_gc === "inativo") return "vermelho";
    if (status_gc === "em_formacao" || total < capacidade * 0.3) return "amarelo";
    return "verde";
  };

  // Geocode address using Google Geocoding API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`
      );
      const data = await res.json();
      if (data.results?.[0]) {
        return data.results[0].geometry.location;
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.lider_nome.trim()) {
      toast.error("Nome do GC e líder são obrigatórios.");
      return;
    }
    setSaving(true);
    const total = parseInt(form.total_membros) || 0;
    const cap = parseInt(form.capacidade) || 20;

    // Geocode the address
    let lat: number | null = null;
    let lng: number | null = null;
    const fullAddress = [form.endereco, form.bairro, "Canoas, RS"].filter(Boolean).join(", ");
    if (fullAddress) {
      const coords = await geocodeAddress(fullAddress);
      if (coords) { lat = coords.lat; lng = coords.lng; }
    }

    const payload = {
      nome: form.nome.trim(),
      lider_nome: form.lider_nome.trim(),
      lider_email: form.lider_email.trim() || null,
      endereco: form.endereco.trim() || null,
      bairro: form.bairro.trim() || null,
      zona: form.zona.trim() || null,
      latitude: lat,
      longitude: lng,
      dia_encontro: form.dia_encontro,
      horario: form.horario.trim() || null,
      capacidade: cap,
      total_membros: total,
      telefone_contato: form.telefone_contato.trim() || null,
      status_gc: form.status_gc,
      status_cor: computeStatusCor(form.status_gc, total, cap) as any,
      observacoes: form.observacoes.trim() || null,
      data_inicio: form.data_inicio || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("grupos_crescimento").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("grupos_crescimento").insert(payload));
    }
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success(editingId ? "GC atualizado!" : "GC cadastrado!"); setShowForm(false); fetchGcs(); }
    setSaving(false);
  };

  const filtered = gcs.filter(g =>
    !search || g.nome.toLowerCase().includes(search.toLowerCase()) ||
    g.lider_nome.toLowerCase().includes(search.toLowerCase()) ||
    (g.bairro || "").toLowerCase().includes(search.toLowerCase())
  );

  const gcsWithCoords = useMemo(() => filtered.filter(g => g.latitude && g.longitude), [filtered]);

  const mapCenter = useMemo(() => {
    if (gcsWithCoords.length === 0) return defaultCenter;
    const avgLat = gcsWithCoords.reduce((s, g) => s + g.latitude!, 0) / gcsWithCoords.length;
    const avgLng = gcsWithCoords.reduce((s, g) => s + g.longitude!, 0) / gcsWithCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [gcsWithCoords]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Mapa de GCs</h1>
          <Badge variant="secondary" className="text-xs">{gcs.length}</Badge>
        </div>
        {isAdmin && (
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo GC
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, líder ou bairro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cards" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Cards</TabsTrigger>
          <TabsTrigger value="mapa" className="gap-1.5"><Map className="h-3.5 w-3.5" /> Mapa</TabsTrigger>
        </TabsList>

        {/* CARDS TAB */}
        <TabsContent value="cards" className="mt-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                {search ? "Nenhum GC encontrado." : "Nenhum GC cadastrado ainda."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(gc => {
                const scfg = statusGCConfig[gc.status_gc] || statusGCConfig.ativo;
                const ccfg = statusCorConfig[gc.status_cor] || statusCorConfig.verde;
                return (
                  <Card key={gc.id} className="border-border hover:border-primary/20 transition-colors">
                    <CardContent className="py-4 px-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-3 w-3 rounded-full shrink-0 ring-2 ${ccfg.bg} ${ccfg.ring}`} />
                          <h3 className="font-semibold text-foreground truncate text-sm">{gc.nome}</h3>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${scfg.cor}`}>
                          {scfg.label}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium text-foreground">{gc.lider_nome}</span>
                        </div>
                        {gc.bairro && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{gc.bairro}{gc.zona ? ` — ${gc.zona}` : ""}</span>
                          </div>
                        )}
                        {gc.dia_encontro?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{gc.dia_encontro.join(", ")}{gc.horario ? ` às ${gc.horario}` : ""}</span>
                          </div>
                        )}
                        {gc.telefone_contato && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{gc.telefone_contato}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {gc.total_membros}/{gc.capacidade} membros
                        </Badge>
                        <div className="flex gap-1">
                          {gc.latitude && gc.longitude && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActiveTab("mapa"); setSelectedMarker(gc.id); }}>
                              <Map className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(gc)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(gc.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* MAP TAB */}
        <TabsContent value="mapa" className="mt-3">
          {!isLoaded ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : gcsWithCoords.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum GC com localização cadastrada. Preencha o endereço ao cadastrar um GC para exibi-lo no mapa.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg overflow-hidden border border-border">
              <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={13}>
                {gcsWithCoords.map(gc => (
                  <Marker
                    key={gc.id}
                    position={{ lat: gc.latitude!, lng: gc.longitude! }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: markerColors[gc.status_cor] || markerColors.verde,
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#ffffff",
                    }}
                    onClick={() => setSelectedMarker(gc.id)}
                  />
                ))}
                {selectedMarker && (() => {
                  const gc = gcsWithCoords.find(g => g.id === selectedMarker);
                  if (!gc) return null;
                  const scfg = statusGCConfig[gc.status_gc] || statusGCConfig.ativo;
                  return (
                    <InfoWindow
                      position={{ lat: gc.latitude!, lng: gc.longitude! }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div style={{ minWidth: 180, fontFamily: "Inter, sans-serif" }}>
                        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{gc.nome}</h3>
                        <p style={{ fontSize: 12, color: "#666", margin: "2px 0" }}>👤 {gc.lider_nome}</p>
                        <p style={{ fontSize: 12, color: "#666", margin: "2px 0" }}>👥 {gc.total_membros}/{gc.capacidade} membros</p>
                        {gc.dia_encontro?.length > 0 && (
                          <p style={{ fontSize: 12, color: "#666", margin: "2px 0" }}>📅 {gc.dia_encontro.join(", ")}{gc.horario ? ` às ${gc.horario}` : ""}</p>
                        )}
                        {gc.bairro && <p style={{ fontSize: 12, color: "#666", margin: "2px 0" }}>📍 {gc.bairro}</p>}
                        <span style={{
                          display: "inline-block", marginTop: 4, fontSize: 10, padding: "2px 6px",
                          borderRadius: 4, backgroundColor: gc.status_cor === "verde" ? "#22c55e" : gc.status_cor === "amarelo" ? "#eab308" : "#ef4444",
                          color: "white", fontWeight: 600
                        }}>{scfg.label}</span>
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FORM DIALOG */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar GC" : "Novo Grupo de Crescimento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Nome do GC *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: GC Esperança" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Líder *</label>
                <Input value={form.lider_nome} onChange={e => setForm(f => ({ ...f, lider_nome: e.target.value }))} placeholder="Nome do líder" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email do líder</label>
                <Input type="email" value={form.lider_email} onChange={e => setForm(f => ({ ...f, lider_email: e.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Endereço (usado para o mapa)</label>
                <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número..." />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Bairro</label>
                <Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Zona</label>
                <Input value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} placeholder="Norte, Sul..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Dia(s) do encontro</label>
              <div className="flex flex-wrap gap-1.5">
                {diasSemana.map(dia => (
                  <button key={dia} type="button" onClick={() => toggleDia(dia)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border
                      ${form.dia_encontro.includes(dia) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/30"}`}>
                    {dia}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Horário</label>
                <Input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Capacidade</label>
                <Input type="number" min="1" value={form.capacidade} onChange={e => setForm(f => ({ ...f, capacidade: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Membros atuais</label>
                <Input type="number" min="0" value={form.total_membros} onChange={e => setForm(f => ({ ...f, total_membros: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Telefone do líder</label>
                <Input value={form.telefone_contato} onChange={e => setForm(f => ({ ...f, telefone_contato: e.target.value }))} placeholder="(51) 99999-0000" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={form.status_gc} onValueChange={v => setForm(f => ({ ...f, status_gc: v as StatusGC }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_formacao">Em formação</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Data de início</label>
              <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Observações</label>
              <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : editingId ? "Atualizar GC" : "Cadastrar GC"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
