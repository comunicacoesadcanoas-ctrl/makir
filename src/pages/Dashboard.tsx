import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import DashboardGeral from "@/components/DashboardGeral";
import DashboardCongregacao from "@/components/DashboardCongregacao";
import DashboardDistrito from "@/components/DashboardDistrito";

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.tipo_acesso;

  // Líder de congregação sees their congregation dashboard
  if (role === "lider_congregacao" && profile?.congregacao_id) {
    return <DashboardCongregacao />;
  }

  // Líder distrital redirects to their distrito context
  if (role === "lider_distrito" && profile?.distrito_id) {
    return <Navigate to={`/app/distrito/${profile.distrito_id}`} replace />;
  }

  // Fallback for leaders without assigned distrito/congregacao
  if (role === "lider_distrito" || role === "lider_congregacao") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">Acesso pendente</p>
          <p className="text-sm text-muted-foreground">
            Você ainda não foi vinculado a {role === "lider_distrito" ? "um distrito" : "uma congregação"}.
            <br />Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  // rede (admin) — full dashboard
  return <DashboardGeral />;
}
