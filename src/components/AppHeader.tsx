import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { profile, user, signOut } = useAuth();
  const nome = profile?.nome || user?.user_metadata?.full_name || "Usuário";
  const foto = profile?.foto_url || user?.user_metadata?.avatar_url || "";

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
            <p className="text-sm font-medium text-foreground">{nome}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.tipo_acesso || "Líder"}</p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-secondary">
            <AvatarImage src={foto} alt={nome} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
