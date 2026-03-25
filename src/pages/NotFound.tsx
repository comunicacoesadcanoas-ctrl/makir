import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Página não encontrada</p>
        <p className="text-sm text-muted-foreground/70">
          O caminho <code className="bg-muted-foreground/10 px-2 py-0.5 rounded text-xs">{location.pathname}</code> não existe.
        </p>
        <Button onClick={() => navigate("/app/dashboard")} className="gap-2 rounded-2xl">
          <Home className="h-4 w-4" /> Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
