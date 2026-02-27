import { BarChart3 } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
      </div>
      <p className="text-muted-foreground">Visualize os relatórios e métricas.</p>
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum relatório disponível.</p>
      </div>
    </div>
  );
}
