import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" /> Anterior
      </Button>
      <span className="text-xs text-muted-foreground px-2">
        {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="gap-1"
      >
        Próximo <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function usePagination<T>(items: T[], perPage = 20) {
  return {
    paginate: (page: number) => {
      const start = (page - 1) * perPage;
      return items.slice(start, start + perPage);
    },
    totalPages: Math.ceil(items.length / perPage),
  };
}
