import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen, Network, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const accessOptions: { value: TipoAcesso; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "recepcao",
    label: "Acesso 01 — Recepção",
    description: "Cadastro e gestão de visitantes",
    icon: <ClipboardList className="h-6 w-6" />,
  },
  {
    value: "discipulador",
    label: "Acesso 02 — Discipulador",
    description: "Acompanhamento de discípulos",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    value: "rede",
    label: "Acesso 03 — Rede",
    description: "Gestão completa da rede de GCs",
    icon: <Network className="h-6 w-6" />,
  },
];

export default function SelecionarAcesso() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TipoAcesso | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const jaTemAcesso = profile?.status === "aprovado";

  const currentAccess = jaTemAcesso
    ? accessOptions.find((opt) => opt.value === profile?.tipo_acesso)
    : null;

  const otherOptions = jaTemAcesso
    ? accessOptions.filter((opt) => opt.value !== profile?.tipo_acesso)
    : accessOptions;

  const handleSubmitNew = async () => {
    if (!selected || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("users").insert({
      id: user.id,
      email: user.email || "",
      nome: user.user_metadata?.full_name || user.email || "",
      foto_url: user.user_metadata?.avatar_url || null,
      tipo_acesso: selected,
    });

    if (error) {
      toast.error("Erro ao salvar solicitação. Tente novamente.");
      console.error(error);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    navigate("/aguardando-aprovacao", { replace: true });
  };

  const handleRequestOther = () => {
    if (!selected) return;
    toast.info("Solicitação enviada! Um administrador irá avaliar seu pedido.");
    setSelected(null);
  };

  // Approved user: 2-card layout
  if (jaTemAcesso && currentAccess) {
    const firstName = profile?.nome?.split(" ")[0] || "Usuário";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center text-foreground">
            Bem-vindo, {firstName}
          </h1>

          {/* Card 1: Current access */}
          <Card className="shadow-lg border-border">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Seu acesso atual
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-secondary bg-secondary/5">
                <div className="p-2 rounded-lg text-secondary">{currentAccess.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{currentAccess.label}</p>
                  <p className="text-xs text-muted-foreground">{currentAccess.description}</p>
                </div>
                <Badge className="bg-green-600 text-white border-transparent hover:bg-green-600">Ativo</Badge>
              </div>
              <Button className="w-full" onClick={() => navigate("/app", { replace: true })}>
                Entrar no sistema <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Request other access */}
          <Card className="shadow-lg border-border">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Solicitar outro acesso
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              {otherOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    selected === opt.value
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selected === opt.value ? "text-secondary" : "text-muted-foreground"}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              ))}
              <Button
                variant="outline"
                onClick={handleRequestOther}
                disabled={!selected}
                className="w-full mt-2"
              >
                Solicitar acesso
              </Button>
            </CardContent>
          </Card>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // New user: original layout
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-bold text-primary">Selecione seu perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha o tipo de acesso que deseja solicitar
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pb-6">
          {accessOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                selected === opt.value
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`p-2 rounded-lg ${selected === opt.value ? "text-secondary" : "text-muted-foreground"}`}>
                {opt.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          ))}

          <Button
            onClick={handleSubmitNew}
            disabled={!selected || submitting}
            className="w-full mt-4"
          >
            {submitting ? "Enviando..." : "Solicitar acesso"}
          </Button>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
