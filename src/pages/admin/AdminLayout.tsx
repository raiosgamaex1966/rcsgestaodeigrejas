import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Mic2,
  MessageSquare,
  Target,
  Users,
  Palette,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Menu,
  BookOpen,
  Trophy,
  Calendar,
  Paintbrush,
  Search,
  Smartphone,
  Church,
  QrCode,
  Bot,
  GraduationCap,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  FileBarChart,
  History,
  PieChart,
  Building2,
  Image,
  Eye,
  UserPlus,
  Heart,
  Cake,
  Home,
  UsersRound,
  HeartHandshake,
  Route,
  Camera,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";

const contentMenuItems = [
  { path: "/admin/banners", label: "Banners", icon: Image },
  { path: "/admin/photos", label: "Galeria de Fotos", icon: Camera },
  { path: "/admin/sermons", label: "Ministrações", icon: Mic2 },
  { path: "/admin/events", label: "Agenda/Eventos", icon: Calendar },
  { path: "/admin/courses", label: "Cursos", icon: GraduationCap },
  { path: "/admin/requests", label: "Solicitações", icon: MessageSquare },
  { path: "/admin/campaigns", label: "Campanhas", icon: Target },
  { path: "/admin/preachers", label: "Pregadores", icon: Users },
  { path: "/admin/themes", label: "Temas", icon: Palette },
  { path: "/admin/plans", label: "Planos de Leitura", icon: BookOpen },
  { path: "/admin/achievements", label: "Conquistas", icon: Trophy },
];

const financialSubItems = [
  { path: "/admin/financial", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/financial/income", label: "Receitas", icon: TrendingUp },
  { path: "/admin/financial/expenses", label: "Despesas", icon: TrendingDown },
  { path: "/admin/financial/approvals", label: "Aprovações", icon: CheckSquare },
  { path: "/admin/financial/reports", label: "Relatórios", icon: FileBarChart },
  { path: "/admin/financial/audit", label: "Auditoria", icon: History },
  { path: "/admin/financial/accounts", label: "Contas", icon: Building2 },
  { path: "/admin/financial/categories", label: "Categorias", icon: PieChart },
];

const membersSubItems = [
  { path: "/admin/members", label: "Visão Geral", icon: Eye },
  { path: "/admin/members/list", label: "Membros Aprovados", icon: Users },
  { path: "/admin/members/approvals", label: "Aprovação de Membros", icon: UserPlus },
  { path: "/admin/members/new-converts", label: "Novos Convertidos", icon: Heart },
  { path: "/admin/members/birthdays", label: "Aniversários", icon: Cake },
  { path: "/admin/members/cells", label: "Células", icon: Home },
  { path: "/admin/members/teams", label: "Equipes", icon: UsersRound },
  { path: "/admin/members/pastoral-care", label: "Atendimento Pastoral", icon: HeartHandshake },
  { path: "/admin/members/journeys", label: "Jornadas", icon: Route },
  { path: "/admin/members/history", label: "Histórico", icon: History },
  { path: "/admin/members/reports", label: "Relatórios", icon: FileBarChart },
];

const settingsMenuItems = [
  { path: "/admin/settings", label: "Igreja", icon: Church },
  { path: "/admin/pix", label: "PIX/Ofertas", icon: QrCode },
  { path: "/admin/ai", label: "Inteligência Artificial", icon: Bot },
  { path: "/admin/appearance", label: "Aparência", icon: Paintbrush },
  { path: "/admin/seo", label: "SEO", icon: Search },
  { path: "/admin/pwa", label: "PWA", icon: Smartphone },
];

interface SidebarNavProps {
  location: any;
  tenant: any;
  signOut: () => void;
  themeLoading: boolean;
  onNavigate?: () => void;
}

const SidebarNav = ({ location, tenant, signOut, themeLoading, onNavigate }: SidebarNavProps) => {
  const [financialOpen, setFinancialOpen] = useState(location.pathname.includes('/financial'));
  const [membersOpen, setMembersOpen] = useState(location.pathname.includes('/members'));

  const getFullHRef = (path: string) => {
    if (!tenant?.slug) return path;
    if (path === "/app") return `/app/${tenant.slug}`;
    if (path.startsWith('/app/')) return path;
    if (path.startsWith('/admin')) {
      return `/app/${tenant.slug}${path}`;
    }
    return `/app/${tenant.slug}${path}`;
  };

  const isFinancialActive = location.pathname.includes('/financial');
  const isMembersActive = location.pathname.includes('/members');

  return (
    <>
      <div className="flex flex-col">
        <div className="p-8 flex items-center justify-center border-b border-border">
          {!themeLoading ? (
            <Link 
              to={getFullHRef("/app")} 
              className="flex flex-col items-center justify-center gap-4 group transition-colors duration-200"
              onClick={onNavigate}
            >
              <img
                src="/logo.png"
                alt="RCS Gestão de Igrejas"
                className="h-16 w-auto object-contain drop-shadow-sm group-hover:drop-shadow-md"
              />
            </Link>
          ) : (
            <Skeleton className="h-14 w-32" />
          )}
        </div>

        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-serif font-bold text-foreground mt-3">
            Painel Admin
          </h1>
        </div>
      </div>

      <nav 
        className="flex-1 p-4 space-y-1 overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Geral</p>

        <Link
          to={getFullHRef("/app")}
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
          Voltar ao Dashboard
        </Link>

        <Link
          to={getFullHRef("/admin")}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
            location.pathname.endsWith('/admin')
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        {/* Membros com submenus */}
        <Collapsible
          open={membersOpen}
          onOpenChange={(open) => {
            setMembersOpen(open);
            if (open) setFinancialOpen(false);
          }}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isMembersActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                Membros
              </div>
              {membersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {membersSubItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={getFullHRef(item.path)}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    location.pathname === getFullHRef(item.path)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Financeiro com submenus */}
        <Collapsible
          open={financialOpen}
          onOpenChange={(open) => {
            setFinancialOpen(open);
            if (open) setMembersOpen(false);
          }}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isFinancialActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5" />
                Financeiro
              </div>
              {financialOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 mt-1 space-y-1">
            {financialSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === getFullHRef(item.path);

              return (
                <Link
                  key={item.path}
                  to={getFullHRef(item.path)}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Conteúdo</p>

        {/* Itens de conteúdo */}
        {contentMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === getFullHRef(item.path);

          return (
            <Link
              key={item.path}
              to={getFullHRef(item.path)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Usuários</p>

        <Link
          to={getFullHRef("/admin/users")}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
            location.pathname === getFullHRef('/admin/users')
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <UserCog className="w-5 h-5" />
          Papéis/Permissões
        </Link>

        <Separator className="my-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Configurações</p>
        {settingsMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === getFullHRef(item.path);

          return (
            <Link
              key={item.path}
              to={getFullHRef(item.path)}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
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
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );
};

const AdminLayout = () => {
  const { user, loading, isAdmin, signOut, tenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoading: themeLoading } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate]);

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

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3 pt-safe flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <SidebarNav
                location={location}
                tenant={tenant}
                signOut={signOut}
                themeLoading={themeLoading}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <h1 className="font-serif font-bold text-foreground truncate">Painel Administrativo</h1>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col sticky top-0 h-screen flex-shrink-0">
          <SidebarNav
            location={location}
            tenant={tenant}
            signOut={signOut}
            themeLoading={themeLoading}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
