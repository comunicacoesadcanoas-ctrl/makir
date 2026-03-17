import { useState, useEffect, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import logoWhite from "@/assets/logo-makir-white.svg";
import logoDark from "@/assets/logo-makir.svg";
import onboarding1 from "@/assets/onboarding-bg-1.jpg";
import onboarding2 from "@/assets/onboarding-bg-2.jpg";
import onboarding3 from "@/assets/onboarding-bg-3.jpg";

const slides = [
  {
    image: onboarding1,
    subtitle: "Gestão inteligente",
    title: "Acompanhe cada visitante e discípulo da sua rede",
  },
  {
    image: onboarding2,
    subtitle: "Dados em tempo real",
    title: "Relatórios e métricas para decisões mais assertivas",
  },
  {
    image: onboarding3,
    subtitle: "Crescimento contínuo",
    title: "Fortaleça o discipulado e multiplique líderes",
  },
];

function OnboardingCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {/* Background images with crossfade */}
      {slides.map((s, i) => (
        <img
          key={i}
          src={s.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Logo */}
      <div className="absolute top-8 left-8">
        <img src={logoWhite} alt="Makir" className="h-8" />
      </div>

      {/* Text content */}
      <div className="absolute bottom-10 left-8 right-8 space-y-3">
        <p className="text-sm font-medium tracking-wide uppercase text-white/70">
          {slide.subtitle}
        </p>
        <h2 className="text-2xl font-bold leading-tight text-white lg:text-3xl">
          {slide.title}
        </h2>
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 right-8 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/app/dashboard";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + from,
      });
      if (result && "error" in result && result.error) {
        setError("Falha ao conectar com o Google. Tente novamente.");
        setBusy(false);
      }
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Left — Carousel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 p-4">
        <OnboardingCarousel />
      </div>

      {/* Right — Login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-10">
          {/* Logo + heading */}
          <div className="space-y-6">
            <img src={logoDark} alt="Makir" className="h-9" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-muted-foreground">
                Acesse sua conta para gerenciar visitantes, discipulados e toda a sua rede eclesiástica.
              </p>
            </div>
          </div>

          {/* Login button */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {busy ? "Conectando..." : "Entrar com Google"}
              </button>

              {error && (
                <p className="text-sm text-destructive font-medium text-center">{error}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground/60">
            Ao continuar, você concorda com os termos de uso do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
