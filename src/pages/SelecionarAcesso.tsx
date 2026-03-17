import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, MapPin, Church } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/logo-makir.svg";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const roles = [
  {
    value: "rede" as TipoAcesso,
    label: "Rede",
    subtitle: "Administrador Geral",
    description: "Acesso completo a todos os distritos, congregações e funcionalidades do sistema.",
    icon: Globe,
  },
  {
    value: "lider_distrito" as TipoAcesso,
    label: "Líder de Distrito",
    subtitle: "Gestão distrital",
    description: "Gerencia as congregações e dados vinculados ao seu distrito.",
    icon: MapPin,
  },
  {
    value: "lider_congregacao" as TipoAcesso,
    label: "Líder de Congregação",
    subtitle: "Gestão local",
    description: "Gerencia visitantes, discípulos e relatórios da sua congregação.",
    icon: Church,
  },
];

export default function SelecionarAcesso() {
  const { session, profile, needsOnboarding, ready, createProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TipoAcesso | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already has profile — go to dashboard
  if (ready && profile) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Not authenticated
  if (ready && !session) {
    return <Navigate to="/login" replace />;
  }

  // Not in onboarding state
  if (ready && !needsOnboarding) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleContinue = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await createProfile(selected);
      navigate("/app/dashboard", { replace: true });
    } catch (e: any) {
      setError(e.message || "Erro ao criar perfil. Tente novamente.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <img src={logoDark} alt="Makir" className="h-10" />
          <p className="text-sm text-muted-foreground">CRM Eclesiástico</p>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Qual é o seu nível de acesso?
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione o papel que melhor descreve sua função
          </p>
        </div>

        <div className="grid gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.value;
            return (
              <Card
                key={role.value}
                onClick={() => setSelected(role.value)}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-ring border-transparent shadow-md"
                    : "hover:border-muted-foreground/30"
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{role.label}</p>
                    <p className="text-xs font-medium text-muted-foreground">{role.subtitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground/80">{role.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selected || busy}
          className="w-full"
          size="lg"
        >
          {busy ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            "Continuar"
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
