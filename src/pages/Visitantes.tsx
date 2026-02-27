import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VisitanteFormDialog } from "@/components/VisitanteFormDialog";
import type { Tables } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Visitante = Tables<"visitantes">;

const statusColors: Record<string, { bg: string; ring: string; label: string }> = {
  vermelho: { bg: "bg-destructive", ring: "ring-destructive/30", label: "Novo" },
  amarelo: { bg: "bg-warning", ring: "ring-warning/30", label: "Quer discipulado" },
  verde: { bg: "bg-success", ring: "ring-success/30", label: "Assumido" },
};

export default function Visitantes() {
  const { user } = useAuth();
  const { canEditRoute, userRole } = usePermissions();
  const canEdit = canEditRoute("/app/visitantes");

  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState<Visitante | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visitante | null>(null);

  const fetchVisitantes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitantes")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar visitantes");
      console.error(error);
    } else {
      setVisitantes(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVisitantes();
  }, [fetchVisitantes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("visitantes").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir visitante");
      console.error(error);
    } else {
      toast.success("Visitante excluído!");
      fetchVisitantes();
    }
    setDeleteTarget(null);
  };

  const filtered = visitantes.filter((v) => {
    const matchesSearch = !search || v.nome.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || v.status_cor === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Visitantes</h1>
          <Badge variant="secondary" className="text-xs">{visitantes.length}</Badge>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditingVisitante(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Visitante
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <FilterButton
            active={statusFilter === null}
            onClick={() => setStatusFilter(null)}
            label="Todos"
          />
          <FilterButton
            active={statusFilter === "vermelho"}
            onClick={() => setStatusFilter("vermelho")}
            label="🔴"
          />
          <FilterButton
            active={statusFilter === "amarelo"}
            onClick={() => setStatusFilter("amarelo")}
            label="🟡"
          />
          <FilterButton
            active={statusFilter === "verde"}
            onClick={() => setStatusFilter("verde")}
            label="🟢"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search || statusFilter ? "Nenhum visitante encontrado com os filtros aplicados." : "Nenhum visitante cadastrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const status = statusColors[v.status_cor] || statusColors.vermelho;
            const formattedDate = new Date(v.criado_em).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric",
            });

            return (
              <Card key={v.id} className="border-border hover:border-secondary/40 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`h-3 w-3 rounded-full shrink-0 ring-2 ${status.bg} ${status.ring}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{v.nome}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        {v.cidade && <span>{v.cidade}</span>}
                        <span>{formattedDate}</span>
                        <span>por {v.cadastrado_por_nome}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => { setEditingVisitante(v); setFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(v)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      {formOpen && (
        <VisitanteFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          visitante={editingVisitante}
          onSuccess={fetchVisitantes}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir visitante?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
        active
          ? "border-secondary bg-secondary/10 text-secondary font-medium"
          : "border-border text-muted-foreground hover:border-muted-foreground/30"
      }`}
    >
      {label}
    </button>
  );
}
