import { MapPin } from "lucide-react";

export default function MapaGCs() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Mapa de GCs</h1>
      </div>
      <p className="text-muted-foreground">Visualize a distribuição dos Grupos de Crescimento.</p>
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum GC cadastrado ainda.</p>
      </div>
    </div>
  );
}
