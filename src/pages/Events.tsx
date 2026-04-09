import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEvents, Event } from "@/hooks/useEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { isSameDay, isToday, isTomorrow, addDays } from "date-fns";
import { DateSelector } from "@/components/events/DateSelector";
import { EventFilters } from "@/components/events/EventFilters";
import { EventGroup } from "@/components/events/EventGroup";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { useAuth } from "@/hooks/useAuth";

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getTenantPath } = useAuth();
  const { data: events, isLoading } = useEvents();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    const eventId = searchParams.get("event");
    if (eventId && events) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setDetailOpen(true);
        setSearchParams({});
      }
    }
  }, [searchParams, events, setSearchParams]);

  const { todayEvents, tomorrowEvents, upcomingEvents, selectedDateEvents } = useMemo(() => {
    if (!events) return { todayEvents: [], tomorrowEvents: [], upcomingEvents: [], selectedDateEvents: [] };

    const today = new Date();
    const tomorrow = addDays(today, 1);

    const typeFiltered = selectedTypes.length === 0 
      ? events 
      : events.filter(e => selectedTypes.includes(e.event_type));

    if (selectedDate) {
      const dateEvents = typeFiltered.filter(event => {
        const eventDate = new Date(event.start_date + "T00:00:00");
        return isSameDay(eventDate, selectedDate);
      });
      return { todayEvents: [], tomorrowEvents: [], upcomingEvents: [], selectedDateEvents: dateEvents };
    }

    const todayEvts: Event[] = [];
    const tomorrowEvts: Event[] = [];
    const upcomingEvts: Event[] = [];

    typeFiltered.forEach(event => {
      const eventDate = new Date(event.start_date + "T00:00:00");
      if (isToday(eventDate)) {
        todayEvts.push(event);
      } else if (isTomorrow(eventDate)) {
        tomorrowEvts.push(event);
      } else if (eventDate > tomorrow) {
        upcomingEvts.push(event);
      }
    });

    return { 
      todayEvents: todayEvts, 
      tomorrowEvents: tomorrowEvts, 
      upcomingEvents: upcomingEvts,
      selectedDateEvents: [] 
    };
  }, [events, selectedTypes, selectedDate]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  const hasNoEvents = !isLoading && 
    todayEvents.length === 0 && 
    tomorrowEvents.length === 0 && 
    upcomingEvents.length === 0 &&
    selectedDateEvents.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12 overflow-x-hidden w-full max-w-[100vw]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-xl font-serif font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Cultos, eventos e reuniões</p>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full overflow-x-hidden">
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          daysToShow={14}
        />

        <EventFilters 
          selectedTypes={selectedTypes} 
          onTypesChange={setSelectedTypes} 
        />

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {selectedDate && selectedDateEvents.length > 0 && (
              <EventGroup
                title="Eventos"
                events={selectedDateEvents}
                onEventClick={handleEventClick}
                showFeatured={true}
              />
            )}

            {!selectedDate && todayEvents.length > 0 && (
              <EventGroup
                title="Hoje"
                events={todayEvents}
                onEventClick={handleEventClick}
                showFeatured={true}
              />
            )}

            {!selectedDate && tomorrowEvents.length > 0 && (
              <EventGroup
                title="Amanhã"
                events={tomorrowEvents}
                onEventClick={handleEventClick}
              />
            )}

            {!selectedDate && upcomingEvents.length > 0 && (
              <EventGroup
                title="Próximos"
                events={upcomingEvents}
                onEventClick={handleEventClick}
                showDate={true}
              />
            )}

            {hasNoEvents && (
              <Card className="border-border/50 bg-card/40 backdrop-blur-md">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {selectedDate || selectedTypes.length > 0
                      ? "Nenhum evento encontrado com os filtros selecionados."
                      : "Nenhum evento programado."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
};

export default Events;
