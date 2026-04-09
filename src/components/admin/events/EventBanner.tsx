import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Pencil, ImageIcon } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { EventStatusBadge } from "./EventStatusBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventBannerProps {
  event: Event & { 
    attendees_count?: number;
    category?: { name: string; color: string; icon: string } | null;
  };
  onEdit: () => void;
}

export const EventBanner = ({ event, onEdit }: EventBannerProps) => {
  const registrationStatus = (event as any).registration_status || "none";
  const registrationLimit = (event as any).registration_limit;
  const attendeesCount = event.attendees_count || 0;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="h-48 md:h-64 relative">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
            <ImageIcon className="w-20 h-20 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <EventStatusBadge 
            status={registrationStatus}
            registrationLimit={registrationLimit}
            attendeesCount={attendeesCount}
          />
          {event.category && (
            <Badge 
              style={{ backgroundColor: event.category.color }}
              className="text-white"
            >
              {event.category.name}
            </Badge>
          )}
          {event.is_featured && (
            <Badge className="bg-gold text-gold-foreground">
              Destaque
            </Badge>
          )}
        </div>
        
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
          {event.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-white/90">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>
              {format(parseISO(event.start_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {event.start_time && ` • ${event.start_time.slice(0, 5)}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="absolute top-4 right-4 gap-1.5"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4" />
        Editar Publicação
      </Button>
    </div>
  );
};
