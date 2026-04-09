import { Link } from "react-router-dom";
import { BookOpen, Headphones, Heart, MessageSquare, Calendar, Trophy, GraduationCap, BookText, UserPlus, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: BookOpen, label: "Bíblia", path: "/bible", color: "bg-primary/20 text-primary" },
  { icon: Calendar, label: "Agenda", path: "/events", color: "bg-accent/20 text-accent" },
  { icon: Headphones, label: "Ministrações", path: "/sermons", color: "bg-primary/20 text-primary" },
  { icon: Heart, label: "Dízimos", path: "/offerings", color: "bg-accent/20 text-accent" },
  { icon: BookText, label: "Planos", path: "/plans", color: "bg-primary/20 text-primary" },
  { icon: GraduationCap, label: "Cursos", path: "/courses", color: "bg-accent/20 text-accent" },
  { icon: MessageSquare, label: "Pedidos", path: "/requests", color: "bg-primary/20 text-primary" },
  { icon: Camera, label: "Galeria", path: "/gallery", color: "bg-primary/20 text-primary" },
  { icon: UserPlus, label: "Visitante", path: "/visitors", color: "bg-green-light/20 text-primary" },
];

export const QuickActions = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              "flex flex-col items-center min-w-[72px] group animate-scale-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-500 group-hover:rounded-[2rem] group-hover:scale-105 relative overflow-hidden",
                action.color.split(' ')[0], // Bg color
                "border border-white/10 shadow-soft group-hover:shadow-card"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Icon className={cn("w-7 h-7 transition-all duration-300 group-hover:scale-110", action.color.split(' ')[1])} />
            </div>
            <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-primary transition-colors text-center whitespace-nowrap">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
