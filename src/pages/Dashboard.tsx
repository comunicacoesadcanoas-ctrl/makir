import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import DashboardGeral from "@/components/DashboardGeral";
import DashboardCongregacao from "@/components/DashboardCongregacao";

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.tipo_acesso;

  // Líder de congregação sees their congregation dashboard
  if (role === "lider_congregacao") {
    return <DashboardCongregacao />;
  }

  // Líder distrital redirects to their distrito context
  if (role === "lider_distrito" && profile?.distrito_id) {
    return <Navigate to={`/app/distrito/${profile.distrito_id}`} replace />;
  }

  // rede (admin) — full dashboard
  return <DashboardGeral />;
}
