import { Outlet } from "react-router-dom";
import { AppSidebar, BottomNav } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-3 md:p-5 pb-20 md:pb-5 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
