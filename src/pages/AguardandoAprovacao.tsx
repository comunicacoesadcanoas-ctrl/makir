import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const tipoAcessoLabels: Record<string, string> = {
  recepcao: "Recepção",
  discipulador: "Discipulador",
  rede: "Rede",
};

export default function AguardandoAprovacao() {
  const { profile, user, signOut } = useAuth();

  const nome = profile?.nome || user?.user_metadata?.full_name || "Usuário";
  const foto = profile?.foto_url || user?.user_metadata?.avatar_url || "";
  const tipoAcesso = profile?.tipo_acesso ? tipoAcessoLabels[profile.tipo_acesso] || profile.tipo_acesso : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border text-center">
        <CardContent className="pt-8 pb-8 space-y-5">
          <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-secondary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-primary">Aguardando Aprovação</h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Seu cadastro está aguardando aprovação do administrador.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 py-4 border-y border-border">
            <Avatar className="h-16 w-16 border-2 border-secondary">
              <AvatarImage src={foto} alt={nome} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg font-semibold">
                {nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{nome}</p>
              <p className="text-xs text-muted-foreground">Acesso solicitado: <span className="font-medium text-secondary">{tipoAcesso}</span></p>
            </div>
          </div>

          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
