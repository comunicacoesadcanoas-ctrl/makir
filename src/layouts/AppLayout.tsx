import { Outlet } from "react-router-dom";
import { AppSidebar, BottomNav } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import DotGridBackground from "@/components/DotGridBackground";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <DotGridBackground className="flex-1 flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </DotGridBackground>
      <BottomNav />
    </div>
  );
}
