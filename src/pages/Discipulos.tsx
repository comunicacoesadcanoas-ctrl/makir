import { BookOpen } from "lucide-react";

export default function Discipulos() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Discípulos</h1>
      </div>
      <p className="text-muted-foreground">Acompanhe o progresso dos discípulos.</p>
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum discípulo cadastrado ainda.</p>
      </div>
    </div>
  );
}
