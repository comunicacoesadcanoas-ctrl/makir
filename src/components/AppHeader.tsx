import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificacoesDropdown } from "@/components/NotificacoesDropdown";
import logoDark from "@/assets/logo-makir.svg";

export function AppHeader() {
  const { profile, user, signOut } = useAuth();
  const nome = profile?.nome || user?.user_metadata?.full_name || "Usuário";
  const foto = profile?.foto_url || user?.user_metadata?.avatar_url || "";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden">
        <img src={logoDark} alt="Makir" className="h-7" />
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <NotificacoesDropdown />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{nome}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{profile?.tipo_acesso || "Líder"}</p>
          </div>
          <Avatar className="h-9 w-9 ring-2 ring-accent/30">
            <AvatarImage src={foto} alt={nome} />
            <AvatarFallback className="bg-accent text-accent-foreground text-sm font-bold">
              {nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}