import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden">
        <h1 className="text-lg font-bold text-primary tracking-tight">MAKIR</h1>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Usuário</p>
            <p className="text-xs text-muted-foreground">Líder</p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-secondary">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
