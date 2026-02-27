import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import ScrollMorphHero from "@/components/ui/scroll-morph-hero";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  const handleContinue = () => {
    if (!profile) {
      navigate("/selecionar-acesso", { replace: true });
    } else if (profile.status === "aprovado") {
      navigate("/app", { replace: true });
    } else if (profile.status === "pendente") {
      navigate("/aguardando-aprovacao", { replace: true });
    } else {
      navigate("/acesso-negado", { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="h-8 w-8 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ScrollMorphHero
      title="MAKIR"
      subtitle="ROLE PARA EXPLORAR"
      contentTitle="CRM Eclesiástico"
      contentDescription="Gerencie visitantes, discipulado e grupos de crescimento de forma simples e eficiente."
    >
      {session ? (
        <Button
          onClick={handleContinue}
          className="gap-3 h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/20 transition-all duration-300"
        >
          Continuar
          <ArrowRight className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          onClick={handleGoogleLogin}
          className="gap-3 h-12 px-8 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg shadow-accent/20 transition-all duration-300"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Entrar com Google
        </Button>
      )}
    </ScrollMorphHero>
  );
}
