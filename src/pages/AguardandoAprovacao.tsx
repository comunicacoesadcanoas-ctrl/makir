import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AguardandoAprovacao() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-border text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Aguardando Aprovação</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Seu cadastro foi realizado com sucesso! Um administrador precisa aprovar sua conta antes que você possa acessar o sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
