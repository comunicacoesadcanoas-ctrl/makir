import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { NotificacoesDropdown } from "@/components/NotificacoesDropdown";
import logoDark from "@/assets/logo-makir.svg";

const roleLabels: Record<string, string> = {
  rede: "Admin",
  lider_distrito: "Líder de Distrito",
  lider_congregacao: "Líder de Congregação",
};

export function AppHeader() {
  const { profile, user } = useAuth();
  const nome = profile?.nome || user?.user_metadata?.full_name || "Usuário";
  const foto = profile?.foto_url || user?.user_metadata?.avatar_url || "";
  const roleLabel = roleLabels[profile?.tipo_acesso || ""] || "Líder";
  const firstName = nome.split(" ")[0];

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4">
      {/* Mobile logo */}
      <div className="md:hidden">
        <img src={logoDark} alt="Makir" className="h-7" />
      </div>

      {/* Greeting - desktop */}
      <div className="hidden md:block">
        <h2 className="text-lg font-bold text-foreground">Olá, {firstName}!</h2>
        <p className="text-xs text-muted-foreground">Veja o que está acontecendo na sua rede hoje</p>
      </div>

      <div className="flex items-center gap-2">
        <NotificacoesDropdown />

        <div className="flex items-center gap-2.5 bg-card rounded-2xl pl-3 pr-1.5 py-1.5 border border-border shadow-sm">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{firstName}</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
          <Avatar className="h-8 w-8 ring-2 ring-accent/20">
            <AvatarImage src={foto} alt={nome} />
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
              {nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
