import { useAuth } from "@/contexts/AuthContext";
import DashboardGeral from "@/components/DashboardGeral";
import DashboardDistrito from "@/components/DashboardDistrito";
import DashboardCongregacao from "@/components/DashboardCongregacao";

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.tipo_acesso;

  if (role === "lider_congregacao") {
    return <DashboardCongregacao />;
  }

  if (role === "lider_distrito") {
    return <DashboardDistrito />;
  }

  // rede (admin) or legacy roles
  return <DashboardGeral />;
}
