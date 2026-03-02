import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Search, Plus, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { PaginationControls, usePagination } from "@/components/Pagination";
import { NovoDiscipuladorDialog } from "@/components/NovoDiscipuladorDialog";

interface Discipulador {
  id: string;
  nome: string;
  email: string;
  foto_url: string | null;
  criado_em: string;
  _count_discipulos?: number;
}

export default function Discipuladores() {
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, nome, email, foto_url, criado_em")
      .eq("status", "aprovado")
      .in("tipo_acesso", ["discipulador", "rede"])
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar discipuladores");
      console.error(error);
    } else {
      // Count discipulos per discipulador
      const { data: discipulos } = await supabase
        .from("discipulos")
        .select("discipulador_id");

      const counts: Record<string, number> = {};
      (discipulos || []).forEach(d => {
        counts[d.discipulador_id] = (counts[d.discipulador_id] || 0) + 1;
      });

      setDiscipuladores(
        (data || []).map(d => ({ ...d, _count_discipulos: counts[d.id] || 0 }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = discipuladores.filter(d =>
    !search || d.nome.toLowerCase().includes(search.toLowerCase())
  );

  const { paginate, totalPages } = usePagination(filtered);
  const paginatedItems = paginate(page);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Discipuladores</h1>
          <Badge variant="secondary" className="text-xs">{discipuladores.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setNovoOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Discipulador
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "Nenhum discipulador encontrado." : "Nenhum discipulador registrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedItems.map(d => {
              const initials = d.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Card key={d.id} className="border-border hover:border-secondary/40 transition-colors">
                  <CardContent className="py-4 px-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{d.nome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {d.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{d._count_discipulos} discípulo{d._count_discipulos !== 1 ? "s" : ""}</span>
                      <span>Desde {new Date(d.criado_em).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <NovoDiscipuladorDialog open={novoOpen} onOpenChange={setNovoOpen} onSuccess={fetch} />
    </div>
  );
}
