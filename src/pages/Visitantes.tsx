import { Users } from "lucide-react";

export default function Visitantes() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Visitantes</h1>
      </div>
      <p className="text-muted-foreground">Gerencie os visitantes da sua igreja.</p>
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum visitante cadastrado ainda.</p>
      </div>
    </div>
  );
}
