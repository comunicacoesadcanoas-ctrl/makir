import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import { DefaultRedirect } from "./components/DefaultRedirect";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DistritoPage = lazy(() => import("./pages/DistritoPage"));
const CongregacaoPage = lazy(() => import("./pages/CongregacaoPage"));
const Visitantes = lazy(() => import("./pages/Visitantes"));
const Discipulos = lazy(() => import("./pages/Discipulos"));
const Discipuladores = lazy(() => import("./pages/Discipuladores"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const MapaGCs = lazy(() => import("./pages/MapaGCs"));
const Admin = lazy(() => import("./pages/Admin"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/app/dashboard" replace />} />
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
                <Route path="distrito/:distritoId" element={<DistritoPage />} />
                <Route path="congregacao/:congId" element={<CongregacaoPage />} />
                <Route path="visitantes" element={<Visitantes />} />
                <Route path="discipulos" element={<Discipulos />} />
                <Route path="discipuladores" element={<Discipuladores />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="mapa-gcs" element={<MapaGCs />} />
                <Route path="admin" element={<Admin />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
