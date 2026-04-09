import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Event } from "@/hooks/useEvents";
import { getEventConfig } from "./EventTypeBadge";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  variant?: "default" | "compact" | "featured";
  showAttendees?: boolean;
  attendeeCount?: number;
  className?: string;
}

export const EventCard = ({ 
  event, 
  onClick, 
  variant = "default", 
  showAttendees = false,
  attendeeCount = 0,
  className 
}: EventCardProps) => {
  const config = getEventConfig(event.event_type);
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-card border border-border cursor-pointer hover:shadow-sm transition-shadow",
          className
        )}
        onClick={onClick}
      >
        <div className={cn("p-2 rounded-lg shrink-0", config.bgColor, config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate">{event.title}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{format(new Date(event.start_date + "T00:00:00"), "dd/MM", { locale: ptBR })}</span>
            {event.start_time && <span>• {event.start_time.slice(0, 5)}</span>}
          </div>
        </div>
        {event.is_featured && (
          <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded shrink-0">
            ★
          </span>
        )}
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20",
          className
        )}
        onClick={onClick}
      >
        <div className="relative">
          {event.image_url ? (
            <div className="w-full aspect-video">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className={cn("w-full aspect-video flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("w-16 h-16 opacity-30", config.color)} />
            </div>
          )}
          
          {event.is_featured && (
            <span className="absolute top-3 right-3 text-xs bg-gold text-white px-2 py-1 rounded font-medium">
              Destaque
            </span>
          )}
          
          {event.image_url && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <span className="text-xs opacity-80">{config.label}</span>
              <h3 className="font-serif font-bold text-lg">{event.title}</h3>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 space-y-3">
          {!event.image_url && (
            <div>
              <span className="text-xs text-muted-foreground">{config.label}</span>
              <h3 className="font-serif font-bold text-lg text-foreground">{event.title}</h3>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.start_date + "T00:00:00"), "EEEE, dd/MM", { locale: ptBR })}
            </div>
            {event.start_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {event.start_time.slice(0, 5)}
              </div>
            )}
          </div>
          
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {showAttendees && attendeeCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-2 border-t border-border">
              <Users className="w-4 h-4" />
              {attendeeCount} {attendeeCount === 1 ? "confirmado" : "confirmados"}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-4">
          {event.image_url ? (
            <div className="w-24 h-24 shrink-0">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={cn("w-24 h-24 shrink-0 flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("w-8 h-8", config.color)} />
            </div>
          )}
          
          <div className="flex-1 min-w-0 py-3 pr-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {event.title}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
              </div>
              {event.is_featured && (
                <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded shrink-0">
                  Destaque
                </span>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(event.start_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              {event.start_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.start_time.slice(0, 5)}
                  {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
