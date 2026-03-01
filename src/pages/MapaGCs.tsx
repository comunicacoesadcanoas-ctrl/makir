import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import {
  MapPin, Plus, Users, Clock, Phone, Pencil, Trash2,
  Search, Map, LayoutGrid, Eye, Navigation, PanelLeftClose, PanelLeft
} from "lucide-react";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import GCDetailDialog from "@/components/GCDetailDialog";

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
  formLat: null as number | null,
  formLng: null as number | null,
};

const defaultCenter: [number, number] = [-51.1833, -29.9167]; // [lng, lat] Canoas, RS

const MAPBOX_TOKEN_KEY = "mapbox_access_token";

function getStoredToken() {
  return localStorage.getItem(MAPBOX_TOKEN_KEY) || "";
}

// ── Glowing dot marker SVG ──
function createGlowMarker(color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.width = "28px";
  el.style.height = "28px";
  el.style.cursor = "pointer";
  el.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="14" fill="${color}" fill-opacity="0.18"/>
    <circle cx="14" cy="14" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>
  </svg>`;
  el.style.animation = "mapPinDrop 0.4s ease-out";
  return el;
}

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
  const [detailGC, setDetailGC] = useState<GC | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapSearch, setMapSearch] = useState("");

  // Mapbox state
  const [mapboxToken, setMapboxToken] = useState(getStoredToken);
  const [tokenInput, setTokenInput] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Form mini-map
  const formMapContainerRef = useRef<HTMLDivElement>(null);
  const formMapRef = useRef<mapboxgl.Map | null>(null);
  const formMarkerRef = useRef<mapboxgl.Marker | null>(null);

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
      formLat: gc.latitude, formLng: gc.longitude,
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

  // Geocode with Mapbox
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address || !mapboxToken) return null;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
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

    let lat: number | null = form.formLat;
    let lng: number | null = form.formLng;
    if (!lat && !lng && form.endereco.trim()) {
      const fullAddress = [form.endereco, form.bairro, "Canoas, RS"].filter(Boolean).join(", ");
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
    else {
      toast.success(editingId ? "GC atualizado!" : "GC cadastrado!");
      setShowForm(false);
      await fetchGcs();
      if (lat && lng) {
        setActiveTab("mapa");
        const { data: found } = await supabase
          .from("grupos_crescimento")
          .select("id")
          .eq("nome", form.nome.trim())
          .order("criado_em", { ascending: false })
          .limit(1)
          .single();
        if (found) setSelectedMarker(found.id);
      }
    }
    setSaving(false);
  };

  const filtered = gcs.filter(g =>
    !search || g.nome.toLowerCase().includes(search.toLowerCase()) ||
    g.lider_nome.toLowerCase().includes(search.toLowerCase()) ||
    (g.bairro || "").toLowerCase().includes(search.toLowerCase())
  );

  const gcsWithCoords = useMemo(() => filtered.filter(g => g.latitude && g.longitude), [filtered]);

  // ── Main Map ──
  useEffect(() => {
    if (activeTab !== "mapa" || !mapboxToken || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: defaultCenter,
      zoom: 13,
    });
    map.addControl(new (mapboxgl.NavigationControl as any)(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [activeTab, mapboxToken]);

  // Update markers when gcs change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeTab !== "mapa") return;

    // Wait for map to be loaded
    const addMarkers = () => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      gcsWithCoords.forEach(gc => {
        const color = markerColors[gc.status_cor] || markerColors.verde;
        const el = createGlowMarker(color);
        const scfg = statusGCConfig[gc.status_gc] || statusGCConfig.ativo;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedMarker(gc.id);

          // Close previous popup
          popupRef.current?.remove();

          const popup = new mapboxgl.Popup({ offset: 20, closeButton: true, maxWidth: "240px" })
            .setLngLat([gc.longitude!, gc.latitude!])
            .setHTML(`
              <div style="font-family:Inter,sans-serif;padding:4px 0">
                <h3 style="font-weight:600;font-size:14px;margin:0 0 4px">${gc.nome}</h3>
                <p style="font-size:12px;color:#aaa;margin:2px 0">👤 ${gc.lider_nome}</p>
                <p style="font-size:12px;color:#aaa;margin:2px 0">👥 ${gc.total_membros}/${gc.capacidade} membros</p>
                ${gc.dia_encontro?.length ? `<p style="font-size:12px;color:#aaa;margin:2px 0">📅 ${gc.dia_encontro.join(", ")}${gc.horario ? ` às ${gc.horario}` : ""}</p>` : ""}
                ${gc.bairro ? `<p style="font-size:12px;color:#aaa;margin:2px 0">📍 ${gc.bairro}</p>` : ""}
                <span style="display:inline-block;margin-top:4px;font-size:10px;padding:2px 8px;border-radius:4px;background:${color};color:#fff;font-weight:600">${scfg.label}</span>
              </div>
            `)
            .addTo(map);

          popup.on("close", () => setSelectedMarker(null));
          popupRef.current = popup;
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([gc.longitude!, gc.latitude!])
          .addTo(map);

        markersRef.current.set(gc.id, marker);
      });

      // Fit bounds
      if (gcsWithCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        gcsWithCoords.forEach(gc => bounds.extend([gc.longitude!, gc.latitude!]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    };

    if (map.isStyleLoaded()) addMarkers();
    else map.on("load", addMarkers);
  }, [gcsWithCoords, activeTab]);

  // Fly to selected marker
  useEffect(() => {
    if (!selectedMarker || !mapRef.current) return;
    const gc = gcsWithCoords.find(g => g.id === selectedMarker);
    if (gc?.longitude && gc?.latitude) {
      mapRef.current.flyTo({ center: [gc.longitude, gc.latitude], zoom: 16, duration: 1200 });
    }
  }, [selectedMarker, gcsWithCoords]);

  // ── Form Mini Map ──
  useEffect(() => {
    if (!showForm || !mapboxToken || !formMapContainerRef.current) return;
    if (formMapRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: formMapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: form.formLat && form.formLng ? [form.formLng, form.formLat] : defaultCenter,
      zoom: form.formLat ? 16 : 13,
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setForm(f => ({ ...f, formLat: lat, formLng: lng }));
      toast.success("Pin posicionado no mapa!");
    });

    formMapRef.current = map;

    return () => {
      formMarkerRef.current?.remove();
      formMarkerRef.current = null;
      map.remove();
      formMapRef.current = null;
    };
  }, [showForm, mapboxToken]);

  // Update form mini map marker
  useEffect(() => {
    const map = formMapRef.current;
    if (!map) return;

    formMarkerRef.current?.remove();

    if (form.formLat && form.formLng) {
      const marker = new mapboxgl.Marker({ color: "#00e5ff", draggable: true })
        .setLngLat([form.formLng, form.formLat])
        .addTo(map);
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        setForm(f => ({ ...f, formLat: lngLat.lat, formLng: lngLat.lng }));
      });
      formMarkerRef.current = marker;
      map.flyTo({ center: [form.formLng, form.formLat], zoom: 16, duration: 800 });
    }
  }, [form.formLat, form.formLng]);

  // Save token
  const handleSaveToken = () => {
    if (!tokenInput.trim()) { toast.error("Insira um token válido"); return; }
    localStorage.setItem(MAPBOX_TOKEN_KEY, tokenInput.trim());
    setMapboxToken(tokenInput.trim());
    toast.success("Token Mapbox salvo!");
  };

  // Sidebar filtered GCs
  const sidebarGCs = gcsWithCoords.filter(g =>
    !mapSearch || g.nome.toLowerCase().includes(mapSearch.toLowerCase())
  );

  // Token setup screen
  if (!mapboxToken && activeTab === "mapa") {
    // We still render the full page, the token prompt shows inside the map tab
  }

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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailGC(gc)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
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
          {!mapboxToken ? (
            <Card className="border-border max-w-md mx-auto">
              <CardContent className="py-8 space-y-4 text-center">
                <MapPin className="h-10 w-10 mx-auto text-[#00e5ff]" />
                <h3 className="text-lg font-semibold text-foreground">Configurar Mapbox</h3>
                <p className="text-sm text-muted-foreground">
                  Insira seu token público do Mapbox para habilitar o mapa interativo. 
                  Obtenha em <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="underline text-[#00e5ff]">mapbox.com</a>.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="pk.eyJ1Ijoi..."
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSaveToken}>Salvar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: "560px" }}>
              {/* Mapbox container */}
              <div ref={mapContainerRef} className="absolute inset-0" />

              {/* Floating sidebar */}
              <div
                className={`absolute top-3 left-3 bottom-3 z-10 transition-all duration-300 ${
                  sidebarOpen ? "w-64" : "w-10"
                }`}
              >
                {sidebarOpen ? (
                  <div className="h-full rounded-xl bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-white/10">
                      <span className="text-sm font-semibold text-white">GCs no mapa</span>
                      <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white transition-colors">
                        <PanelLeftClose className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                        <input
                          placeholder="Filtrar..."
                          value={mapSearch}
                          onChange={e => setMapSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5ff]/50"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                      {sidebarGCs.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-4">Nenhum GC localizado</p>
                      ) : (
                        sidebarGCs.map(gc => {
                          const color = markerColors[gc.status_cor] || markerColors.verde;
                          const isActive = selectedMarker === gc.id;
                          return (
                            <button
                              key={gc.id}
                              onClick={() => setSelectedMarker(gc.id)}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${
                                isActive
                                  ? "bg-[#00e5ff]/10 border-[#00e5ff]/30 text-white"
                                  : "bg-transparent border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                                />
                                <span className="font-medium truncate">{gc.nome}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 pl-[18px]">
                                <span className="text-[10px] text-white/40">{gc.lider_nome}</span>
                                <Navigation className="h-3 w-3 text-[#00e5ff]/60" />
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="h-10 w-10 rounded-xl bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Empty state */}
              {gcsWithCoords.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-4 text-center">
                    <MapPin className="h-8 w-8 mx-auto text-[#00e5ff] mb-2" />
                    <p className="text-sm text-white/70">Nenhum GC com localização cadastrada.</p>
                    <p className="text-xs text-white/40 mt-1">Preencha o endereço ao cadastrar um GC.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FORM DIALOG */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { formMapRef.current?.remove(); formMapRef.current = null; formMarkerRef.current = null; } }}>
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
                {form.formLat && form.formLng && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 Coordenadas: {form.formLat.toFixed(5)}, {form.formLng.toFixed(5)}
                  </p>
                )}
              </div>

              {/* Mini map to click and set pin */}
              {mapboxToken && (
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-foreground">Ou clique no mapa para posicionar o pin</label>
                  <div className="rounded-lg overflow-hidden border border-border" style={{ height: "220px" }}>
                    <div ref={formMapContainerRef} style={{ width: "100%", height: "100%" }} />
                  </div>
                </div>
              )}
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

      {detailGC && (
        <GCDetailDialog
          open={!!detailGC}
          onOpenChange={() => setDetailGC(null)}
          gc={detailGC}
          onUpdate={fetchGcs}
        />
      )}
    </div>
  );
}
