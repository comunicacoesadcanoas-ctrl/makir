import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen, Network } from "lucide-react";
import { motion } from "framer-motion";
import logoMakir from "@/assets/logo-makir.svg";
import { resolveUserLandingRoute } from "@/lib/resolve-route";
import type { Database } from "@/integrations/supabase/types";

type TipoAcesso = Database["public"]["Enums"]["tipo_acesso_enum"];

const accessOptions: { value: TipoAcesso; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "recepcao",
    label: "Acesso 01 — Recepção",
    description: "Cadastro e gestão de visitantes",
    icon: <ClipboardList className="h-6 w-6" />,
  },
  {
    value: "discipulador",
    label: "Acesso 02 — Discipulador",
    description: "Acompanhamento de discípulos",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    value: "rede",
    label: "Acesso 03 — Rede",
    description: "Gestão completa da rede de GCs",
    icon: <Network className="h-6 w-6" />,
  },
];

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0, 0, 0.2, 1] as const },
  }),
};

export default function SelecionarAcesso() {
  const { session, user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TipoAcesso | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Already has profile → go straight to app
  if (profile?.status === "aprovado") {
    return <Navigate to={resolveUserLandingRoute(profile)} replace />;
  }

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("users").insert({
      id: user.id,
      email: user.email || "",
      nome: user.user_metadata?.full_name || user.email || "",
      foto_url: user.user_metadata?.avatar_url || null,
      tipo_acesso: selected,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("Você já possui um cadastro! Redirecionando...");
        await refreshProfile();
        const freshProfile = (await supabase.from("users").select("*").eq("id", user.id).maybeSingle()).data;
        navigate(resolveUserLandingRoute(freshProfile), { replace: true });
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
        console.error(error);
      }
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    // Status defaults to 'aprovado' now, go straight to app
    const freshProfile = (await supabase.from("users").select("*").eq("id", user.id).maybeSingle()).data;
    navigate(resolveUserLandingRoute(freshProfile), { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <img src={logoMakir} alt="Makir" className="h-20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Escolha seu perfil de acesso para continuar
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            {accessOptions.map((opt, i) => (
              <motion.button
                key={opt.value}
                custom={i}
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                onClick={() => setSelected(opt.value)}
                aria-pressed={selected === opt.value}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selected === opt.value
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`p-2 rounded-lg ${selected === opt.value ? "text-secondary" : "text-muted-foreground"}`}>
                  {opt.icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </motion.button>
            ))}

            <Button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="w-full mt-4"
            >
              {submitting ? "Entrando..." : "Continuar"}
            </Button>

            <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
