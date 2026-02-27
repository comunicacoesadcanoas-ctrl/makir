import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: string;
  data: Record<string, any>[];
  sheetName: string;
  /** Optional: show status filter */
  showStatusFilter?: boolean;
  /** Optional: show discipulador filter */
  discipuladores?: string[];
  /** Filter function receives (row, filters) */
  filterFn?: (row: any, filters: { start: string; end: string; status: string; discipulador: string }) => boolean;
  /** Transform row before export */
  transformFn?: (row: any) => Record<string, any>;
}

export function ExportDialog({
  open, onOpenChange, tipo, data, sheetName,
  showStatusFilter, discipuladores, filterFn, transformFn,
}: ExportDialogProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState("all");
  const [discipulador, setDiscipulador] = useState("all");

  const handleExport = () => {
    let filtered = data;
    if (filterFn) {
      filtered = data.filter(row => filterFn(row, { start, end, status, discipulador }));
    }
    const transformed = transformFn ? filtered.map(transformFn) : filtered;
    if (transformed.length === 0) {
      return;
    }
    exportToExcel(transformed, sheetName, tipo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar {sheetName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data início</label>
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data fim</label>
              <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>

          {showStatusFilter && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verde">🟢 Verde</SelectItem>
                  <SelectItem value="amarelo">🟡 Amarelo</SelectItem>
                  <SelectItem value="vermelho">🔴 Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {discipuladores && discipuladores.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Discipulador</label>
              <Select value={discipulador} onValueChange={setDiscipulador}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {discipuladores.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleExport} className="w-full gap-2">
            <Download className="h-4 w-4" /> Exportar Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
