import { Users, BookOpen, BarChart3, MapPin, LayoutDashboard, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useBadgeCounts } from "@/hooks/useBadgeCounts";

const allNavItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, badgeKey: null },
  { title: "Visitantes", url: "/app/visitantes", icon: Users, badgeKey: "visitantesAmarelos" as const },
  { title: "Discípulos", url: "/app/discipulos", icon: BookOpen, badgeKey: "discipulosVermelhos" as const },
  { title: "Relatórios", url: "/app/relatorios", icon: BarChart3, badgeKey: null },
  { title: "Mapa de GCs", url: "/app/mapa-gcs", icon: MapPin, badgeKey: null },
  { title: "Admin", url: "/app/admin", icon: ShieldCheck, badgeKey: "pendentesAdmin" as const },
];

export function AppSidebar() {
  const location = useLocation();
  const { canViewRoute } = usePermissions();
  const badges = useBadgeCounts();

  const visibleItems = allNavItems.filter((item) => canViewRoute(item.url));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-primary min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">MAKIR</h1>
        <p className="text-sm text-primary-foreground/60 mt-1">CRM Eclesiástico</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50"
              }`}
              activeClassName=""
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {badgeCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-primary-foreground/40">© 2026 MAKIR</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { canViewRoute } = usePermissions();
  const badges = useBadgeCounts();

  const visibleItems = allNavItems
    .filter((item) => canViewRoute(item.url))
    .filter((item) => item.url !== "/app/admin");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`relative flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
              activeClassName=""
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-[14px] flex items-center justify-center px-0.5">
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
