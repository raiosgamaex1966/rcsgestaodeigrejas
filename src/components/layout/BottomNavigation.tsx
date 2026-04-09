import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Headphones, CalendarCheck, User, Menu, Heart, Gift, HelpCircle, Settings, Mic, PenTool, Shield, GraduationCap, UserPlus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Início", path: "/app" },
  { icon: BookOpen, label: "Bíblia", path: "/bible" },
  { icon: CalendarCheck, label: "Eventos", path: "/events" },
  { icon: Headphones, label: "Palavra", path: "/sermons" },
  { icon: User, label: "Perfil", path: "/profile" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { canRecord, canCreateSermon, user, isAdmin, tenant } = useAuth();

  const getFullHRef = (path: string) => {
    if (!tenant?.slug) return path;
    if (path.startsWith('/app')) {
      return path.replace('/app', `/app/${tenant.slug}`);
    }
    return `/app/${tenant.slug}${path}`;
  };

  const dynamicNavItems = navItems.map(item => ({
    ...item,
    path: getFullHRef(item.path)
  }));

  // Build dynamic menu items based on user permissions
  const moreMenuItems = [
    ...(isAdmin ? [{ icon: Shield, label: "Painel Admin", path: getFullHRef("/admin"), description: "Gerenciar aplicativo" }] : []),
    { icon: Camera, label: "Galeria", path: getFullHRef("/gallery"), description: "Fotos dos cultos" },
    { icon: GraduationCap, label: "Cursos", path: getFullHRef("/courses"), description: "Treinamentos em vídeo" },
    { icon: Heart, label: "Pedidos", path: getFullHRef("/requests"), description: "Oração, batismo, visitação" },
    { icon: Gift, label: "Ofertas", path: getFullHRef("/offerings"), description: "Dízimos e campanhas" },
    ...(canRecord ? [{ icon: Mic, label: "Gravar", path: getFullHRef("/sermons/record"), description: "Gravar ministração" }] : []),
    ...(canCreateSermon ? [{ icon: PenTool, label: "Criar Ministração", path: getFullHRef("/sermons/create"), description: "Criar com IA ou manual" }] : []),
    { icon: HelpCircle, label: "Instalar App", path: getFullHRef("/install"), description: "Adicionar à tela inicial" },
    { icon: Settings, label: "Configurações", path: getFullHRef("/profile"), description: "Conta e preferências" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-primary/5 pb-safe md:hidden rounded-t-[2.5rem] shadow-[0_-15px_40px_-20px_rgba(22,101,52,0.2)]">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-6">
        {dynamicNavItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                isActive ? "text-primary" : "text-primary/40 hover:text-primary/70"
              )}
            >
              <div className={cn(
                "relative p-3 rounded-2xl transition-all duration-500",
                isActive && "bg-primary/10 scale-110 shadow-soft"
              )}>
                <Icon
                  className={cn(
                    "w-7 h-7 transition-all duration-300",
                    isActive && "stroke-[2.5px]"
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-bounce-subtle" />
                )}
              </div>
            </Link>
          );
        })}

        {/* Menu Mais */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 text-muted-foreground/60 hover:text-foreground group"
            >
              <div className="relative p-2 rounded-2xl transition-all duration-300 group-hover:bg-primary/5 group-hover:scale-110">
                <Menu className="w-6 h-6" strokeWidth={2} />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-[2.5rem] bg-background/80 backdrop-blur-2xl border-white/5 p-6 pb-12">
            <SheetHeader className="pb-8">
              <div className="w-12 h-1.5 bg-muted/20 rounded-full mx-auto mb-4" />
              <SheetTitle className="text-2xl font-serif font-black text-center bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Explorar</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4">
              {moreMenuItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-5 rounded-[1.5rem] bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 shadow-soft">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <span className="font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{item.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground/60 text-center uppercase tracking-tighter">
                      {item.description}
                    </span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
