import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import SelecionarAcesso from "./pages/SelecionarAcesso";
import AguardandoAprovacao from "./pages/AguardandoAprovacao";
import AcessoNegado from "./pages/AcessoNegado";
import Dashboard from "./pages/Dashboard";
import Visitantes from "./pages/Visitantes";
import Discipulos from "./pages/Discipulos";
import Relatorios from "./pages/Relatorios";
import MapaGCs from "./pages/MapaGCs";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { DefaultRedirect } from "./components/DefaultRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/selecionar-acesso" element={<SelecionarAcesso />} />
            <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />
            <Route path="/acesso-negado" element={<AcessoNegado />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DefaultRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="visitantes" element={<Visitantes />} />
              <Route path="discipulos" element={<Discipulos />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="mapa-gcs" element={<MapaGCs />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
