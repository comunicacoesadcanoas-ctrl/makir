import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Check, X, Clock, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllAccessRequests, useResolveAccessRequest } from "@/hooks/useAccessRequests";
import { AdminDistritosTab } from "@/components/AdminDistritosTab";
import type { Tables, Database } from "@/integrations/supabase/types";

type UserRow = Tables<"users">;
type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const tipoLabels: Record<TipoAcesso, string> = {
  recepcao: "Recepção",
  discipulador: "Discipulador",
  rede: "Rede",
};

export default function Admin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: accessRequests = [], isLoading: loadingRequests } = useAllAccessRequests();
  const resolveRequest = useResolveAccessRequest();
  const pendingAccessRequests = accessRequests.filter((r) => r.status === "pendente");

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("criado_em", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateStatus = async (userId: string, status: "aprovado" | "rejeitado") => {
    const { error } = await supabase.from("users").update({ status }).eq("id", userId);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(status === "aprovado" ? "Usuário aprovado!" : "Usuário rejeitado.");
      fetchUsers();
    }
  };

  const updateTipoAcesso = async (userId: string, tipo_acesso: TipoAcesso) => {
    const { error } = await supabase.from("users").update({ tipo_acesso }).eq("id", userId);
    if (error) {
      toast.error("Erro ao alterar tipo de acesso");
    } else {
      toast.success("Tipo de acesso atualizado!");
      fetchUsers();
    }
  };

  const revokeUser = async (userId: string) => {
    const { error } = await supabase.from("users").update({ status: "rejeitado" as const }).eq("id", userId);
    if (error) {
      toast.error("Erro ao revogar acesso");
    } else {
      toast.success("Acesso revogado.");
      fetchUsers();
    }
  };

  const handleResolveAccess = async (requestId: string, decision: "aprovado" | "rejeitado") => {
    try {
      await resolveRequest.mutateAsync({ requestId, decision });
      toast.success(decision === "aprovado" ? "Acesso alterado com sucesso!" : "Solicitação rejeitada.");
      fetchUsers();
    } catch {
      toast.error("Erro ao processar solicitação.");
    }
  };

  const pending = users.filter((u) => u.status === "pendente");
  const approved = users.filter((u) => u.status === "aprovado");
  const rejected = users.filter((u) => u.status === "rejeitado");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Painel do Administrador</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><Check className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{approved.length}</p>
              <p className="text-xs text-muted-foreground">Aprovados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><X className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rejected.length}</p>
              <p className="text-xs text-muted-foreground">Rejeitados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-2">
            Pendentes
            {pending.length > 0 && (
              <span className="bg-warning text-warning-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
          <TabsTrigger value="rejeitados">Rejeitados</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="gap-2">
            Solicitações
            {pendingAccessRequests.length > 0 && (
              <span className="bg-secondary text-secondary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                {pendingAccessRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <EmptyState text="Nenhuma solicitação pendente." />
          ) : (
            pending.map((user) => (
              <UserCard key={user.id} user={user}>
                <Button size="sm" onClick={() => updateStatus(user.id, "aprovado")} className="bg-success hover:bg-success/90 text-success-foreground gap-1">
                  <Check className="h-4 w-4" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(user.id, "rejeitado")} className="border-destructive text-destructive hover:bg-destructive/10 gap-1">
                  <X className="h-4 w-4" /> Rejeitar
                </Button>
              </UserCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="aprovados" className="space-y-3 mt-4">
          {approved.length === 0 ? (
            <EmptyState text="Nenhum usuário aprovado." />
          ) : (
            approved.map((user) => (
              <UserCard key={user.id} user={user}>
                <Select defaultValue={user.tipo_acesso} onValueChange={(val) => updateTipoAcesso(user.id, val as TipoAcesso)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                    <SelectItem value="discipulador">Discipulador</SelectItem>
                    <SelectItem value="rede">Rede</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => revokeUser(user.id)} className="border-destructive text-destructive hover:bg-destructive/10 gap-1">
                  <X className="h-4 w-4" /> Revogar
                </Button>
              </UserCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejeitados" className="space-y-3 mt-4">
          {rejected.length === 0 ? (
            <EmptyState text="Nenhum usuário rejeitado." />
          ) : (
            rejected.map((user) => (
              <UserCard key={user.id} user={user}>
                <Button size="sm" onClick={() => updateStatus(user.id, "aprovado")} className="bg-success hover:bg-success/90 text-success-foreground gap-1">
                  <Check className="h-4 w-4" /> Aprovar
                </Button>
              </UserCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-3 mt-4">
          {loadingRequests ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingAccessRequests.length === 0 ? (
            <EmptyState text="Nenhuma solicitação de troca de acesso pendente." />
          ) : (
            pendingAccessRequests.map((req) => (
              <Card key={req.id} className="border-border">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <ArrowRightLeft className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{req.user_nome || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{tipoLabels[req.acesso_atual]}</Badge>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      <Badge className="bg-secondary/10 text-secondary border-secondary/30">{tipoLabels[req.acesso_solicitado]}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" onClick={() => handleResolveAccess(req.id, "aprovado")} className="bg-success hover:bg-success/90 text-success-foreground gap-1" disabled={resolveRequest.isPending}>
                        <Check className="h-4 w-4" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleResolveAccess(req.id, "rejeitado")} className="border-destructive text-destructive hover:bg-destructive/10 gap-1" disabled={resolveRequest.isPending}>
                        <X className="h-4 w-4" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-border">
      <CardContent className="py-8 text-center text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

function UserCard({ user, children }: { user: UserRow; children: React.ReactNode }) {
  const formattedDate = new Date(user.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <Card className="border-border">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border border-border shrink-0">
              <AvatarImage src={user.foto_url || ""} alt={user.nome} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                {user.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{user.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {tipoLabels[user.tipo_acesso]}
            </Badge>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}
