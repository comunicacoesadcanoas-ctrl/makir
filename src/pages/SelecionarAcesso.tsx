import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen, Network } from "lucide-react";
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
  const { user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TipoAcesso | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
            onClick={handleSubmit}
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
