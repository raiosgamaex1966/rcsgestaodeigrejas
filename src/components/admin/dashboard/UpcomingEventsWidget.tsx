import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpcomingDashboardEvents } from "@/hooks/useDashboardStats";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export const UpcomingEventsWidget = () => {
  const { data: events, isLoading } = useUpcomingDashboardEvents(5);
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
          <button
            onClick={() => navigate("/admin/events")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum evento programado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/admin/events/${event.id}`)}
                className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer group"
              >
                {/* Date badge */}
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-xs text-primary font-medium">
                    {format(parseISO(event.start_date), "MMM", { locale: ptBR }).toUpperCase()}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {format(parseISO(event.start_date), "dd")}
                  </span>
                </div>
                
                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {event.start_time && (
                      <span>{event.start_time.slice(0, 5)}</span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Attendees count */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {event.attendeesCount}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
