import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificacoesDropdown() {
  const { notificacoes, unreadCount, markAsRead, markAllAsRead } = useNotificacoes();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm text-foreground">Notificações</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notificacoes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.lida && markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    n.lida ? "opacity-60" : "bg-secondary/5 hover:bg-secondary/10"
                  }`}
                >
                  <p className="text-foreground leading-snug">{n.mensagem}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.criado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
