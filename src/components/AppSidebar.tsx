import { Users, BookOpen, BarChart3, MapPin, LayoutDashboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Visitantes", url: "/app/visitantes", icon: Users },
  { title: "Discípulos", url: "/app/discipulos", icon: BookOpen },
  { title: "Relatórios", url: "/app/relatorios", icon: BarChart3 },
  { title: "Mapa de GCs", url: "/app/mapa-gcs", icon: MapPin },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-primary min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">MAKIR</h1>
        <p className="text-sm text-primary-foreground/60 mt-1">CRM Eclesiástico</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
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
              <span>{item.title}</span>
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export { navItems };
