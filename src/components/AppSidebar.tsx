import { useState } from "react";
import { Users, BookOpen, BarChart3, MapPin, LayoutDashboard, ShieldCheck, Settings, ChevronDown, UserCog, HeartHandshake, Church } from "lucide-react";
import logoWhite from "@/assets/logo-makir-white.svg";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";

type NavItem = { title: string; url: string; icon: React.ElementType; badgeKey: "visitantesAmarelos" | "discipulosVermelhos" | "pendentesAdmin" | null };

function SidebarLink({ item, isActive, badgeCount }: { item: NavItem; isActive: boolean; badgeCount: number }) {
  return (
    <NavLink
      to={item.url}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
      activeClassName=""
    >
      <item.icon className="h-4.5 w-4.5" />
      <span className="flex-1">{item.title}</span>
      {badgeCount > 0 && (
        <span className="bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
          {badgeCount}
        </span>
      )}
    </NavLink>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { canViewRoute, userRole, isAdmin, isLiderDistrito } = usePermissions();
  const badges = useBadgeCounts();

  // Build nav items based on role
  const navItems: NavItem[] = [];

  // Dashboard is always first
  navItems.push({ title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, badgeKey: null });

  // Visitantes - accessible to most roles
  if (canViewRoute("/app/visitantes")) {
    navItems.push({ title: "Visitantes", url: "/app/visitantes", icon: Users, badgeKey: "visitantesAmarelos" });
  }

  // Discipulado section
  if (canViewRoute("/app/discipulos")) {
    navItems.push({ title: "Discípulos", url: "/app/discipulos", icon: BookOpen, badgeKey: "discipulosVermelhos" });
  }
  if (canViewRoute("/app/discipuladores")) {
    navItems.push({ title: "Discipuladores", url: "/app/discipuladores", icon: UserCog, badgeKey: null });
  }

  // Relatórios
  if (canViewRoute("/app/relatorios")) {
    navItems.push({ title: "Relatórios", url: "/app/relatorios", icon: BarChart3, badgeKey: null });
  }

  // Mapa GCs (admin only)
  if (canViewRoute("/app/mapa-gcs")) {
    navItems.push({ title: "Mapa de GCs", url: "/app/mapa-gcs", icon: MapPin, badgeKey: null });
  }

  // Admin & Config (admin only)
  if (canViewRoute("/app/admin")) {
    navItems.push({ title: "Admin", url: "/app/admin", icon: ShieldCheck, badgeKey: "pendentesAdmin" });
  }
  if (canViewRoute("/app/configuracoes")) {
    navItems.push({ title: "Configurações", url: "/app/configuracoes", icon: Settings, badgeKey: null });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar min-h-screen">
      <div className="p-6">
        <img src={logoWhite} alt="Makir" className="h-10" />
      </div>

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

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/30 tracking-wide">© 2026 MAKIR</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { canViewRoute, userRole } = usePermissions();
  const badges = useBadgeCounts();

  const allMobileItems: NavItem[] = [
    { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, badgeKey: null },
    { title: "Visitantes", url: "/app/visitantes", icon: Users, badgeKey: "visitantesAmarelos" as const },
    { title: "Discípulos", url: "/app/discipulos", icon: BookOpen, badgeKey: "discipulosVermelhos" as const },
    { title: "Relatórios", url: "/app/relatorios", icon: BarChart3, badgeKey: null },
  ];
  const mobileItems = allMobileItems.filter(item => canViewRoute(item.url));

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
