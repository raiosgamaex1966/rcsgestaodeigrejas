import { Outlet } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { Footer } from "./Footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children?: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-x-hidden ${isMobile ? 'pb-16' : ''}`}>
          <div className="flex-1">
            {children || <Outlet />}
          </div>
          <Footer />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileNav />}
      </div>
    </div>
  );
};
