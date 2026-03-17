import { useState } from "react";
import { Users, BookOpen, BarChart3, MapPin, LayoutDashboard, ShieldCheck, Settings, ChevronRight, Church, ArrowLeft, Eye } from "lucide-react";
import logoWhite from "@/assets/logo-makir-white.svg";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";
import { useSidebarContext, type SidebarMode } from "@/hooks/useSidebarContext";
import { Skeleton } from "@/components/ui/skeleton";

type NavItem = { title: string; url: string; icon: React.ElementType; badgeKey: "visitantesAmarelos" | "discipulosVermelhos" | "pendentesAdmin" | null };

function SidebarLink({ item, isActive, badgeCount }: { item: NavItem; isActive: boolean; badgeCount: number }) {
  return (
    <NavLink
      to={item.url}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
      activeClassName=""
    >
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
        isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent/50"
      }`}>
        <item.icon className="h-4 w-4" />
      </div>
      <span className="flex-1">{item.title}</span>
      {badgeCount > 0 && (
        <span className="bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
          {badgeCount}
        </span>
      )}
    </NavLink>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors w-full rounded-lg hover:bg-sidebar-accent/30"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3">
      <Skeleton className="h-8 w-full bg-sidebar-accent/30" />
      <Skeleton className="h-8 w-3/4 bg-sidebar-accent/30" />
      <Skeleton className="h-8 w-5/6 bg-sidebar-accent/30" />
    </div>
  );
}

// ─── Global Sidebar ───
function GlobalSidebar({ badges }: { badges: ReturnType<typeof useBadgeCounts> }) {
  const location = useLocation();
  const { canViewRoute } = usePermissions();

  const navItems: NavItem[] = [];
  navItems.push({ title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, badgeKey: null });
  if (canViewRoute("/app/visitantes")) navItems.push({ title: "Visitantes", url: "/app/visitantes", icon: Users, badgeKey: "visitantesAmarelos" });
  if (canViewRoute("/app/discipulos")) navItems.push({ title: "Discípulos", url: "/app/discipulos", icon: BookOpen, badgeKey: "discipulosVermelhos" });
  if (canViewRoute("/app/relatorios")) navItems.push({ title: "Relatórios", url: "/app/relatorios", icon: BarChart3, badgeKey: null });
  if (canViewRoute("/app/mapa-gcs")) navItems.push({ title: "Mapa de GCs", url: "/app/mapa-gcs", icon: MapPin, badgeKey: null });
  if (canViewRoute("/app/admin")) navItems.push({ title: "Admin", url: "/app/admin", icon: ShieldCheck, badgeKey: "pendentesAdmin" });
  if (canViewRoute("/app/configuracoes")) navItems.push({ title: "Configurações", url: "/app/configuracoes", icon: Settings, badgeKey: null });

  return (
    <nav className="flex-1 px-3 space-y-0.5">
      {navItems.map(item => (
        <SidebarLink
          key={item.url}
          item={item}
          isActive={location.pathname === item.url}
          badgeCount={item.badgeKey ? badges[item.badgeKey] || 0 : 0}
        />
      ))}
    </nav>
  );
}

// ─── Distrito Sidebar ───
function DistritoSidebar({ distrito, loading }: { distrito: NonNullable<ReturnType<typeof useSidebarContext>["distrito"]> | null; loading: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || !distrito) return <SidebarSkeleton />;

  const distritoUrl = `/app/distrito/${distrito.id}`;

  return (
    <nav className="flex-1 px-3 space-y-1">
      <BackButton label="Dashboard Geral" onClick={() => navigate("/app/dashboard")} />

      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Church className="h-4 w-4 text-sidebar-primary" />
          <span className="text-sm font-bold text-sidebar-foreground">Distrito {distrito.numero}</span>
        </div>
        <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 pl-6">{distrito.nome}</p>
      </div>

      <SidebarLink
        item={{ title: "Visão Geral", url: distritoUrl, icon: Eye, badgeKey: null }}
        isActive={location.pathname === distritoUrl}
        badgeCount={0}
      />

      {/* Congregações section */}
      {distrito.congregacoes.length > 0 && (
        <div className="pt-4">
          <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-wider mb-2">
            Congregações
          </p>
          <div className="space-y-0.5">
            {distrito.congregacoes.map(c => (
              <NavLink
                key={c.id}
                to={`/app/congregacao/${c.id}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname === `/app/congregacao/${c.id}`
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                activeClassName=""
              >
                <Church className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{c.nome}</span>
                <ChevronRight className="h-3 w-3 opacity-40" />
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Congregação Sidebar ───
function CongregacaoSidebar({ congregacao, loading }: { congregacao: NonNullable<ReturnType<typeof useSidebarContext>["congregacao"]> | null; loading: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (loading || !congregacao) return <SidebarSkeleton />;

  const congUrl = `/app/congregacao/${congregacao.id}`;

  return (
    <nav className="flex-1 px-3 space-y-1">
      <BackButton
        label={`Distrito ${congregacao.distritoNumero}`}
        onClick={() => navigate(`/app/distrito/${congregacao.distritoId}`)}
      />

      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Church className="h-4 w-4 text-sidebar-primary" />
          <span className="text-sm font-bold text-sidebar-foreground truncate">{congregacao.nome}</span>
        </div>
        <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 pl-6">{congregacao.distritoNome}</p>
      </div>

      <SidebarLink
        item={{ title: "Visão Geral", url: congUrl, icon: Eye, badgeKey: null }}
        isActive={location.pathname === congUrl}
        badgeCount={0}
      />
    </nav>
  );
}

// ─── Main Sidebar ───
export function AppSidebar() {
  const badges = useBadgeCounts();
  const { mode, distrito, congregacao, loading } = useSidebarContext();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar min-h-screen rounded-r-3xl">
      <div className="p-6">
        <img src={logoWhite} alt="Makir" className="h-10" />
      </div>

      {mode === "distrito" && <DistritoSidebar distrito={distrito} loading={loading} />}
      {mode === "congregacao" && <CongregacaoSidebar congregacao={congregacao} loading={loading} />}
      {mode === "global" && <GlobalSidebar badges={badges} />}

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/30 tracking-wide">© 2026 MAKIR</p>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (Mobile) ───
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canViewRoute } = usePermissions();
  const badges = useBadgeCounts();
  const { mode, distrito, congregacao } = useSidebarContext();

  let mobileItems: NavItem[] = [];

  if (mode === "distrito" && distrito) {
    mobileItems = [
      { title: "Voltar", url: "/app/dashboard", icon: ArrowLeft, badgeKey: null },
      { title: "Visão Geral", url: `/app/distrito/${distrito.id}`, icon: Eye, badgeKey: null },
    ];
  } else if (mode === "congregacao" && congregacao) {
    mobileItems = [
      { title: "Distrito", url: `/app/distrito/${congregacao.distritoId}`, icon: ArrowLeft, badgeKey: null },
      { title: "Visão Geral", url: `/app/congregacao/${congregacao.id}`, icon: Eye, badgeKey: null },
    ];
  } else {
    const allMobileItems: NavItem[] = [
      { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, badgeKey: null },
      { title: "Visitantes", url: "/app/visitantes", icon: Users, badgeKey: "visitantesAmarelos" },
      { title: "Discípulos", url: "/app/discipulos", icon: BookOpen, badgeKey: "discipulosVermelhos" },
      { title: "Relatórios", url: "/app/relatorios", icon: BarChart3, badgeKey: null },
    ];
    mobileItems = allMobileItems.filter(item => canViewRoute(item.url));
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 backdrop-blur-sm bg-card/95">
      <div className="flex justify-around items-center h-16">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.url;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`relative flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors ${
                isActive ? "text-accent font-semibold" : "text-muted-foreground"
              }`}
              activeClassName=""
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-secondary text-secondary-foreground text-[9px] font-bold rounded-full h-4 min-w-[14px] flex items-center justify-center px-0.5">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[60px]">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
