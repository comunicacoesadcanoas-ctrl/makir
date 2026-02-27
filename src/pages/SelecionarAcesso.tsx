import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen, Network, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMyAccessRequests, useCreateAccessRequest } from "@/hooks/useAccessRequests";
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

  if (profile?.status === "pendente") return <Navigate to="/aguardando-aprovacao" replace />;
  if (profile?.status === "rejeitado") return <Navigate to="/acesso-negado" replace />;

  // --- Derived state ---
  const jaTemAcesso = profile?.status === "aprovado";
  const currentAccess = jaTemAcesso ? accessOptions.find((opt) => opt.value === profile?.tipo_acesso) : null;
  const otherOptions = jaTemAcesso ? accessOptions.filter((opt) => opt.value !== profile?.tipo_acesso) : accessOptions;

  // Helper: get pending request status for a given access type
  const getRequestStatus = (tipo: TipoAcesso) => {
    return myRequests.find((r) => r.acesso_solicitado === tipo && r.status === "pendente");
  };

  // --- Handlers ---
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
      toast.error("Erro ao salvar solicitação. Tente novamente.");
      console.error(error);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    navigate("/aguardando-aprovacao", { replace: true });
  };

  const handleRequestOther = async () => {
    if (!selected || !profile) return;
    try {
      await createRequest.mutateAsync({
        acesso_atual: profile.tipo_acesso,
        acesso_solicitado: selected,
      });
      toast.success("Solicitação enviada! Um administrador irá avaliar seu pedido.");
      setSelected(null);
    } catch (e: any) {
      if (e?.code === "23505") {
        toast.error("Você já possui uma solicitação pendente para esse acesso.");
      } else {
        toast.error("Erro ao enviar solicitação.");
        console.error(e);
      }
    }
  };

  // --- Approved user: 2-card layout ---
  if (jaTemAcesso && currentAccess) {
    const firstName = profile?.nome?.split(" ")[0] || "Usuário";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          <motion.h1
            className="text-2xl font-bold text-center text-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Bem-vindo, {firstName}
          </motion.h1>

          {/* Card 1: Current access */}
          <motion.div custom={0} variants={fadeSlide} initial="hidden" animate="visible">
            <Card className="shadow-lg border-border">
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Seu acesso atual
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-secondary bg-secondary/5">
                  <div className="p-2 rounded-lg text-secondary">{currentAccess.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{currentAccess.label}</p>
                    <p className="text-xs text-muted-foreground">{currentAccess.description}</p>
                  </div>
                  <Badge className="bg-success text-success-foreground border-transparent">Ativo</Badge>
                </div>
                <Button className="w-full" onClick={() => navigate("/app", { replace: true })}>
                  Entrar no sistema <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Request other access */}
          <motion.div custom={1} variants={fadeSlide} initial="hidden" animate="visible">
            <Card className="shadow-lg border-border">
              <CardHeader className="pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Solicitar outro acesso
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                {otherOptions.map((opt) => {
                  const pendingReq = getRequestStatus(opt.value);
                  const isPending = !!pendingReq;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => !isPending && setSelected(opt.value)}
                      disabled={isPending}
                      aria-pressed={selected === opt.value}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isPending
                          ? "border-warning/30 bg-warning/5 cursor-not-allowed opacity-70"
                          : selected === opt.value
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isPending ? "text-warning" : selected === opt.value ? "text-secondary" : "text-muted-foreground"
                      }`}>
                        {opt.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                      {isPending && (
                        <Badge variant="outline" className="text-warning border-warning/40 gap-1 shrink-0">
                          <Clock className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={handleRequestOther}
                  disabled={!selected || createRequest.isPending}
                  className="w-full mt-2"
                >
                  {createRequest.isPending ? "Enviando..." : "Solicitar acesso"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={fadeSlide} initial="hidden" animate="visible">
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
              Sair
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- New user: original layout ---
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

            <Button variant="ghost" className="w-full text-muted-foreground" onClick={signOut}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
