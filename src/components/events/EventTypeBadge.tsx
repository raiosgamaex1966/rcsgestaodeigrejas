import { Church, PartyPopper, Users, BookOpen, Music, Star, Flame, Mountain, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export const eventTypeConfig: Record<string, { icon: typeof Church; color: string; bgColor: string; label: string }> = {
  culto: { icon: Church, color: "text-primary", bgColor: "bg-primary/10", label: "Culto" },
  celula: { icon: Users, color: "text-green-600", bgColor: "bg-green-500/10", label: "Célula" },
  conferencia: { icon: Mic, color: "text-purple-600", bgColor: "bg-purple-500/10", label: "Conferência" },
  retiro: { icon: Mountain, color: "text-orange-600", bgColor: "bg-orange-500/10", label: "Retiro" },
  louvor: { icon: Music, color: "text-pink-600", bgColor: "bg-pink-500/10", label: "Louvor" },
  especial: { icon: Star, color: "text-gold", bgColor: "bg-gold/10", label: "Especial" },
  estudo: { icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-500/10", label: "Estudo Bíblico" },
  jovens: { icon: Flame, color: "text-red-600", bgColor: "bg-red-500/10", label: "Jovens" },
  evento: { icon: PartyPopper, color: "text-burgundy", bgColor: "bg-burgundy/10", label: "Evento" },
  reuniao: { icon: Users, color: "text-burgundy", bgColor: "bg-burgundy/10", label: "Reunião" },
};

interface EventTypeBadgeProps {
  type: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const EventTypeBadge = ({ type, showLabel = true, size = "md", className }: EventTypeBadgeProps) => {
  const config = eventTypeConfig[type] || eventTypeConfig.evento;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-lg", sizeClasses[size], config.bgColor, config.color)}>
        <Icon className={iconSizes[size]} />
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
      )}
    </div>
  );
};

export const getEventConfig = (type: string) => {
  return eventTypeConfig[type] || eventTypeConfig.evento;
};
