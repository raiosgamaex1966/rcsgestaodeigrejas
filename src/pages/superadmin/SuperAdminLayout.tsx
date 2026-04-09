import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Church,
  Users,
  CreditCard,
  Send,
  Settings,
  LogOut,
  ChevronLeft,
  Loader2,
  Menu,
  BarChart3,
  FileText,
  ShieldCheck,
  FileSignature,
  Activity,
  Megaphone, // Added for Alerts
  Map, // Added for Maps
  Wallet, // Added for Gateway
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const mainMenuItems = [
  { path: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/superadmin/churches", label: "Igrejas", icon: Church },
  { path: "/superadmin/plans", label: "Planos & Valores", icon: CreditCard },
  { path: "/superadmin/invites", label: "Convites", icon: Send },
  { path: "/superadmin/alerts", label: "Comunicados", icon: Megaphone },
];

const reportsMenuItems = [
  { path: "/superadmin/financial", label: "Financeiro Global", icon: BarChart3 },
  { path: "/superadmin/retention", label: "Retenção de Membros", icon: Activity },
  { path: "/superadmin/map", label: "Mapa de Membros", icon: Map },
  { path: "/superadmin/contracts", label: "Contratos", icon: FileText },
];

const settingsMenuItems = [
  { path: "/superadmin/gateway", label: "Gateways", icon: Wallet },
  { path: "/superadmin/security", label: "Segurança & LGPD", icon: ShieldCheck },
  { path: "/superadmin/audit", label: "Auditoria", icon: FileSignature },
  { path: "/superadmin/settings", label: "Configurações", icon: Settings },
];

const SuperAdminLayout = () => {
  const { user, loading, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && userRole !== "owner") {
      navigate("/app");
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "owner") {
    return null;
  }

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const NavContent = () => (
    <>
      <div className="p-6 flex flex-col items-center border-b border-border bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="bg-white/10 p-3 rounded-2xl mb-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-white font-bold text-lg">RCS Gestão</h2>
        <p className="text-slate-400 text-xs mt-1">Painel do Proprietário</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Gestão
        </p>

        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Relatórios
        </p>

        {reportsMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Sistema
        </p>

        {settingsMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">RC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Robson Cordeiro</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 pt-safe flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/10">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <NavContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="font-bold truncate">Painel do Proprietário</h1>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col sticky top-0 h-screen">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
