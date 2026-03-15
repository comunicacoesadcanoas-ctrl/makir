import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Church, MapPin, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Distrito {
  id: string;
  numero: number;
  nome: string;
}

interface Congregacao {
  id: string;
  distrito_id: string;
  nome: string;
  cidade: string | null;
  pastor: string | null;
}

interface UserRow {
  id: string;
  nome: string;
  email: string;
  congregacao_id: string | null;
}

export function AdminDistritosTab() {
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDistrito, setExpandedDistrito] = useState<string | null>(null);

  // Dialog states
  const [distritoDialog, setDistritoDialog] = useState(false);
  const [editingDistrito, setEditingDistrito] = useState<Distrito | null>(null);
  const [distritoNome, setDistritoNome] = useState("");
  const [distritoNumero, setDistritoNumero] = useState("");

  const [congregacaoDialog, setCongregacaoDialog] = useState(false);
  const [editingCongregacao, setEditingCongregacao] = useState<Congregacao | null>(null);
  const [congNome, setCongNome] = useState("");
  const [congCidade, setCongCidade] = useState("");
  const [congPastor, setCongPastor] = useState("");
  const [congDistritoId, setCongDistritoId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ type: "distrito" | "congregacao"; id: string; nome: string } | null>(null);

  // User assignment
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignCongregacaoId, setAssignCongregacaoId] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [dRes, cRes, uRes] = await Promise.all([
      supabase.from("distritos").select("*").order("numero"),
      supabase.from("congregacoes").select("*").order("nome"),
      supabase.from("users").select("id, nome, email, congregacao_id").eq("status", "aprovado").order("nome"),
    ]);
    setDistritos(dRes.data || []);
    setCongregacoes(cRes.data || []);
    setUsers(uRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveDistrito = async () => {
    if (!distritoNome.trim() || !distritoNumero) return;
    const payload = { nome: distritoNome.trim(), numero: parseInt(distritoNumero) };
    let error;
    if (editingDistrito) {
      ({ error } = await supabase.from("distritos").update(payload).eq("id", editingDistrito.id));
    } else {
      ({ error } = await supabase.from("distritos").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar distrito"); console.error(error); }
    else { toast.success("Distrito salvo!"); setDistritoDialog(false); fetchAll(); }
  };

  const handleSaveCongregacao = async () => {
    if (!congNome.trim() || !congDistritoId) return;
    const payload = {
      nome: congNome.trim(),
      distrito_id: congDistritoId,
      cidade: congCidade.trim() || null,
      pastor: congPastor.trim() || null,
    };
    let error;
    if (editingCongregacao) {
      ({ error } = await supabase.from("congregacoes").update(payload).eq("id", editingCongregacao.id));
    } else {
      ({ error } = await supabase.from("congregacoes").insert(payload));
    }
    if (error) { toast.error("Erro ao salvar congregação"); console.error(error); }
    else { toast.success("Congregação salva!"); setCongregacaoDialog(false); fetchAll(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === "distrito" ? "distritos" : "congregacoes";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
    if (error) { toast.error(`Erro ao excluir ${deleteTarget.type}`); console.error(error); }
    else { toast.success("Excluído com sucesso!"); fetchAll(); }
    setDeleteTarget(null);
  };

  const handleAssignUser = async () => {
    if (!assignUserId) return;
    const congId = assignCongregacaoId === "none" ? null : assignCongregacaoId || null;
    const { error } = await supabase.from("users").update({ congregacao_id: congId }).eq("id", assignUserId);
    if (error) { toast.error("Erro ao atribuir congregação"); console.error(error); }
    else { toast.success("Congregação atribuída!"); setAssignDialog(false); fetchAll(); }
  };

  const openEditDistrito = (d: Distrito) => {
    setEditingDistrito(d);
    setDistritoNome(d.nome);
    setDistritoNumero(String(d.numero));
    setDistritoDialog(true);
  };

  const openNewDistrito = () => {
    setEditingDistrito(null);
    setDistritoNome("");
    setDistritoNumero("");
    setDistritoDialog(true);
  };

  const openEditCongregacao = (c: Congregacao) => {
    setEditingCongregacao(c);
    setCongNome(c.nome);
    setCongCidade(c.cidade || "");
    setCongPastor(c.pastor || "");
    setCongDistritoId(c.distrito_id);
    setCongregacaoDialog(true);
  };

  const openNewCongregacao = (distritoId?: string) => {
    setEditingCongregacao(null);
    setCongNome("");
    setCongCidade("");
    setCongPastor("");
    setCongDistritoId(distritoId || "");
    setCongregacaoDialog(true);
  };

  const getCongName = (congId: string | null) => {
    if (!congId) return "Sem congregação";
    return congregacoes.find(c => c.id === congId)?.nome || "—";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={openNewDistrito} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Distrito
        </Button>
        <Button size="sm" variant="outline" onClick={() => openNewCongregacao()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Congregação
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setAssignUserId(""); setAssignCongregacaoId(""); setAssignDialog(true); }} className="gap-1.5">
          <MapPin className="h-4 w-4" /> Atribuir Usuário
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{distritos.length}</p>
            <p className="text-xs text-muted-foreground">Distritos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{congregacoes.length}</p>
            <p className="text-xs text-muted-foreground">Congregações</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{users.filter(u => u.congregacao_id).length}</p>
            <p className="text-xs text-muted-foreground">Usuários vinculados</p>
          </CardContent>
        </Card>
      </div>

      {/* Distritos tree */}
      <div className="space-y-2">
        {distritos.map(d => {
          const congs = congregacoes.filter(c => c.distrito_id === d.id);
          const isExpanded = expandedDistrito === d.id;
          const usersInDistrito = users.filter(u => congs.some(c => c.id === u.congregacao_id));

          return (
            <Card key={d.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedDistrito(isExpanded ? null : d.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <Church className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground flex-1">
                    Distrito {d.numero} — {d.nome}
                  </span>
                  <Badge variant="secondary" className="text-xs">{congs.length} cong.</Badge>
                  <Badge variant="outline" className="text-xs">{usersInDistrito.length} usuários</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDistrito(d)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ type: "distrito", id: d.id, nome: d.nome })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-6 space-y-1.5">
                    {congs.map(c => {
                      const congUsers = users.filter(u => u.congregacao_id === c.id);
                      return (
                        <div key={c.id} className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-muted/30">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground flex-1">{c.nome}</span>
                          {c.pastor && <span className="text-xs text-muted-foreground">Pr. {c.pastor}</span>}
                          <Badge variant="outline" className="text-[10px]">{congUsers.length} usr</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditCongregacao(c)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteTarget({ type: "congregacao", id: c.id, nome: c.nome })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => openNewCongregacao(d.id)}>
                      <Plus className="h-3 w-3" /> Adicionar congregação
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned users */}
      {users.filter(u => !u.congregacao_id).length > 0 && (
        <Card className="border-warning/30">
          <CardContent className="py-3">
            <p className="text-sm font-medium text-warning mb-2">Usuários sem congregação ({users.filter(u => !u.congregacao_id).length})</p>
            <div className="space-y-1">
              {users.filter(u => !u.congregacao_id).map(u => (
                <div key={u.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-foreground">{u.nome} <span className="text-muted-foreground text-xs">({u.email})</span></span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAssignUserId(u.id); setAssignCongregacaoId(""); setAssignDialog(true); }}>
                    Atribuir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distrito Dialog */}
      <Dialog open={distritoDialog} onOpenChange={setDistritoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingDistrito ? "Editar Distrito" : "Novo Distrito"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Número *</Label>
              <Input type="number" value={distritoNumero} onChange={e => setDistritoNumero(e.target.value)} placeholder="Ex: 1" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={distritoNome} onChange={e => setDistritoNome(e.target.value)} placeholder="Nome do distrito" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDistritoDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveDistrito} disabled={!distritoNome.trim() || !distritoNumero}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Congregação Dialog */}
      <Dialog open={congregacaoDialog} onOpenChange={setCongregacaoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCongregacao ? "Editar Congregação" : "Nova Congregação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Distrito *</Label>
              <Select value={congDistritoId} onValueChange={setCongDistritoId}>
                <SelectTrigger><SelectValue placeholder="Selecionar distrito" /></SelectTrigger>
                <SelectContent>
                  {distritos.map(d => (
                    <SelectItem key={d.id} value={d.id}>Distrito {d.numero} — {d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={congNome} onChange={e => setCongNome(e.target.value)} placeholder="Nome da congregação" />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={congCidade} onChange={e => setCongCidade(e.target.value)} placeholder="Cidade" />
            </div>
            <div className="space-y-1.5">
              <Label>Pastor</Label>
              <Input value={congPastor} onChange={e => setCongPastor(e.target.value)} placeholder="Nome do pastor" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCongregacaoDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveCongregacao} disabled={!congNome.trim() || !congDistritoId}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atribuir Congregação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Usuário *</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome} {u.congregacao_id ? `(${getCongName(u.congregacao_id)})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Congregação</Label>
              <Select value={assignCongregacaoId} onValueChange={setAssignCongregacaoId}>
                <SelectTrigger><SelectValue placeholder="Selecionar congregação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem congregação</SelectItem>
                  {distritos.map(d => {
                    const congs = congregacoes.filter(c => c.distrito_id === d.id);
                    return congs.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} (Dist. {d.numero})
                      </SelectItem>
                    ));
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancelar</Button>
              <Button onClick={handleAssignUser} disabled={!assignUserId}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteTarget?.type === "distrito" ? "distrito" : "congregação"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
