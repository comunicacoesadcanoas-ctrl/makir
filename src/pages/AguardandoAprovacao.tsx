import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, RefreshCw, LogOut } from "lucide-react";
import logoDark from "@/assets/logo-makir.svg";
import { useState } from "react";

export default function AguardandoAprovacao() {
  const { session, profile, ready, signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  if (ready && !session) {
    return <Navigate to="/login" replace />;
  }

  if (ready && profile?.status === "aprovado") {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (ready && !profile) {
    return <Navigate to="/app/selecionar-acesso" replace />;
  }

  const isRejected = profile?.status === "rejeitado";

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <img src={logoDark} alt="Makir" className="h-10" />
          <p className="text-sm text-muted-foreground">CRM Eclesiástico</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {isRejected ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-foreground">Acesso negado</h1>
                <p className="text-sm text-muted-foreground">
                  Sua solicitação de acesso foi negada pelo administrador. Entre em contato caso acredite que isso seja um engano.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-foreground">Aguardando aprovação</h1>
                <p className="text-sm text-muted-foreground">
                  Seu cadastro está aguardando aprovação do administrador da rede. Você será notificado quando seu acesso for liberado.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleCheck} disabled={checking} variant="outline" className="w-full">
            {checking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Verificar novamente
          </Button>
          <Button onClick={signOut} variant="ghost" className="w-full text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
