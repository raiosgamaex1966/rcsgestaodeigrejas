import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { EventCard } from "./EventCard";

interface UpcomingEventsWidgetProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export const UpcomingEventsWidget = ({ limit = 3, showHeader = true, className }: UpcomingEventsWidgetProps) => {
  const { data: events, isLoading } = useUpcomingEvents(limit);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events" className="text-primary">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {events.map((event) => (
          <Link key={event.id} to={`/events?event=${event.id}`}>
            <EventCard event={event} variant="compact" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
