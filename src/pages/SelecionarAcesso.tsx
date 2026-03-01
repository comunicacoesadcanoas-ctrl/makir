import { useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen, Network, ArrowRight, Clock, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMyAccessRequests, useCreateAccessRequest } from "@/hooks/useAccessRequests";
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

type Step = "choose" | "solicitar" | "ja-tenho";

export default function SelecionarAcesso() {
  const { session, user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [selected, setSelected] = useState<TipoAcesso | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  const { data: myRequests = [], isLoading: loadingRequests } = useMyAccessRequests();
  const createRequest = useCreateAccessRequest();

  // --- Guards ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // If profile already loaded and approved → redirect straight to app
  if (profile?.status === "aprovado") {
    return <Navigate to={resolveUserLandingRoute(profile)} replace />;
  }
  if (profile?.status === "pendente") return <Navigate to="/aguardando-aprovacao" replace />;
  if (profile?.status === "rejeitado") return <Navigate to="/acesso-negado" replace />;

  // --- Handlers ---
  const handleJaTenhoAcesso = async () => {
    setChecking(true);
    try {
      // Force re-fetch profile from DB
      await refreshProfile();
      // After refresh, the component will re-render.
      // If profile is now approved, the guard above will redirect.
      // If still null, the user doesn't actually have access.
      const { data } = await supabase
        .from("users")
        .select("status, tipo_acesso")
        .eq("id", user!.id)
        .maybeSingle();

      if (data?.status === "aprovado") {
        navigate(resolveUserLandingRoute(data as any), { replace: true });
      } else if (data?.status === "pendente") {
        navigate("/aguardando-aprovacao", { replace: true });
      } else if (data) {
        toast.error("Seu acesso foi negado. Entre em contato com o administrador.");
      } else {
        toast.error("Nenhum cadastro encontrado para este email. Solicite acesso primeiro.");
        setStep("choose");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao verificar acesso. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const handleSubmitNew = async () => {
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
        // User already exists — refresh and redirect
        toast.info("Você já possui um cadastro! Redirecionando...");
        await refreshProfile();
        navigate(resolveUserLandingRoute(profile), { replace: true });
      } else {
        toast.error("Erro ao salvar solicitação. Tente novamente.");
        console.error(error);
      }
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    navigate("/aguardando-aprovacao", { replace: true });
  };

  // --- Step: Choose ---
  if (step === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md space-y-4"
        >
          <h1 className="text-2xl font-bold text-center text-foreground">
            Bem-vindo ao Makir
          </h1>
          <p className="text-sm text-center text-muted-foreground">
            O que deseja fazer?
          </p>

          <motion.div custom={0} variants={fadeSlide} initial="hidden" animate="visible">
            <Card
              className="shadow-lg border-border cursor-pointer hover:border-secondary/50 transition-all duration-200"
              onClick={() => setStep("solicitar")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-lg">Solicitar Acesso</p>
                  <p className="text-sm text-muted-foreground">
                    Ainda não tenho cadastro no sistema
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={1} variants={fadeSlide} initial="hidden" animate="visible">
            <Card
              className="shadow-lg border-border cursor-pointer hover:border-secondary/50 transition-all duration-200"
              onClick={handleJaTenhoAcesso}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                  {checking ? <Loader2 className="h-7 w-7 animate-spin" /> : <UserCheck className="h-7 w-7" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-lg">Já tenho acesso</p>
                  <p className="text-sm text-muted-foreground">
                    Meu email já foi aprovado pelo administrador
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={fadeSlide} initial="hidden" animate="visible">
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
              Sair
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // --- Step: Solicitar (new user form) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold text-primary">Selecione seu perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha o tipo de acesso que deseja solicitar
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
              onClick={handleSubmitNew}
              disabled={!selected || submitting}
              className="w-full mt-4"
            >
              {submitting ? "Enviando..." : "Solicitar acesso"}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setStep("choose")}
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
