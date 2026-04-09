import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ChevronRight, ImageIcon } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { EventStatusBadge } from "./EventStatusBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface EventCardAdminProps {
  event: Event & { 
    attendees_count?: number;
    category?: { name: string; color: string; icon: string } | null;
  };
}

export const EventCardAdmin = ({ event }: EventCardAdminProps) => {
  const navigate = useNavigate();
  const attendeesCount = event.attendees_count || 0;
  
  const registrationStatus = (event as any).registration_status || "none";
  const registrationLimit = (event as any).registration_limit;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => navigate(`/admin/events/${event.id}`)}>
      <div className="relative h-40">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <EventStatusBadge 
            status={registrationStatus} 
            registrationLimit={registrationLimit}
            attendeesCount={attendeesCount}
          />
        </div>
        {event.is_featured && (
          <Badge className="absolute top-2 right-2 bg-gold text-gold-foreground">
            Destaque
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          {event.category && (
            <Badge 
              variant="outline" 
              style={{ borderColor: event.category.color, color: event.category.color }}
              className="text-xs"
            >
              {event.category.name}
            </Badge>
          )}
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(parseISO(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
              {event.start_time && ` às ${event.start_time.slice(0, 5)}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {attendeesCount}
                {registrationLimit && `/${registrationLimit}`} inscritos
              </span>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              Ver detalhes
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
