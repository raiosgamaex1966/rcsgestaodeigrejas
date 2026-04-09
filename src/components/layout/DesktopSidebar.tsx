import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  CalendarCheck,
  Headphones,
  Heart,
  Gift,
  Shield,
  Settings,
  LogOut,
  Calendar,
  GraduationCap,
  Camera,
  PenTool,
  Moon,
  Sun,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDarkMode } from "@/hooks/useDarkMode";

const mainNavItems = [
  { icon: Home, label: "Início", path: "/app" },
  { icon: BookOpen, label: "Bíblia", path: "/bible" },
  { icon: CalendarCheck, label: "Planos de Leitura", path: "/plans" },
  { icon: Headphones, label: "Ministrações", path: "/sermons" },
  { icon: GraduationCap, label: "Cursos", path: "/courses" },
  { icon: Calendar, label: "Eventos", path: "/events" },
  { icon: Camera, label: "Galeria", path: "/gallery" },
];

const secondaryNavItems = [
  { icon: Heart, label: "Pedidos", path: "/requests" },
  { icon: Gift, label: "Ofertas", path: "/offerings" },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const { user, userRole, isMember, isVisitor, isAdmin, signOut, canCreateSermon, tenant } = useAuth();
  const { settings, isLoading: themeLoading } = useTheme();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "U";

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    // Se estivermos em uma rota com slug, removemos o prefixo para comparar
    const pathWithoutSlug = tenant?.slug 
      ? currentPath.replace(`/app/${tenant.slug}`, '/app') 
      : currentPath;
    
    if (path === "/app") return pathWithoutSlug === "/app" || pathWithoutSlug === "/";
    return pathWithoutSlug.startsWith(path);
  };

  const getFullHRef = (path: string) => {
    if (!tenant?.slug) return path;
    if (path.startsWith('/app')) {
      return path.replace('/app', `/app/${tenant.slug}`);
    }
    // Para rotas como /bible que não começam com /app mas queremos que fiquem sob o slug para membros
    return `/app/${tenant.slug}${path}`;
  };

  // Dynamic values from tenant or settings
  const churchName = tenant?.name || settings?.church_name || 'RCS Gestão';
  const logoUrl = "/logo.png"; // Default RCS Logo

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border sticky top-0">
      {/* Logo */}
      <div className="p-8 flex items-center justify-center border-b border-border">
        {!themeLoading && (
          <Link to={tenant?.slug ? `/app/${tenant.slug}` : "/"} className="flex flex-col items-center justify-center gap-4 group">
            <img
              src={logoUrl}
              alt="RCS Gestão"
              className="h-20 w-auto object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all mb-2"
            />
            <h1 className="text-xl font-serif font-bold text-black text-center line-clamp-2 px-2">
              {churchName}
            </h1>
          </Link>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Menu Principal
        </p>
        {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const fullPath = getFullHRef(item.path);

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

        <Separator className="my-4" />

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Serviços
        </p>
        {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const fullPath = getFullHRef(item.path);

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

        {canCreateSermon && (
          <Link
            to={getFullHRef("/sermons/create")}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive("/sermons/create")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <PenTool className={cn("w-5 h-5", isActive("/sermons/create") && "text-primary")} />
            <span>Criar Ministração</span>
          </Link>
        )}



        {isAdmin && (
          <>
            <Separator className="my-4" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Administração
            </p>
            {userRole === 'owner' && (
              <Link
                to="/superadmin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1",
                  isActive("/superadmin")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-bold">Painel Proprietário</span>
              </Link>
            )}
            <Link
              to={getFullHRef("/admin")}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive("/admin")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Shield className="w-5 h-5" />
              <span>Painel Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        {user ? (
          <div className="space-y-3">
            <Link
              to={getFullHRef("/profile")}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isActive("/profile")
                  ? "bg-primary/10"
                  : "hover:bg-secondary"
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </Link>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link to="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        ) : (
          <Button asChild className="w-full">
            <Link to={tenant?.slug ? `/${tenant.slug}/auth` : "/auth"}>Entrar</Link>
          </Button>
        )}
      </div>
    </aside>
  );
};
