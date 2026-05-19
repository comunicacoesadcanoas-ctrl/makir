import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-makir.svg";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        <img src={logoDark} alt="Makir" className="h-10 mx-auto" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bem-vindo ao Makir
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie visitantes, discipulados e toda a sua rede eclesiástica.
          </p>
        </div>

        <button
          onClick={() => navigate("/app/dashboard")}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
