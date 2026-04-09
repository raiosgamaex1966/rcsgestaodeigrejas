import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Event } from "@/hooks/useEvents";
import { getEventConfig } from "@/components/events/EventTypeBadge";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const getRegistrationStatus = (event: Event) => {
  if (!event.allow_public_registration) return null;

  const now = new Date();
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;

  if (deadline && now > deadline) {
    return { label: "Inscrições Encerradas", variant: "secondary" as const };
  }

  if (event.registration_limit) {
    // For simplicity, assume registrations are open if there's a limit
    return { label: "Inscrições Abertas", variant: "default" as const };
  }

  return { label: "Inscrições Abertas", variant: "default" as const };
};

export const FeaturedEventsWidget = () => {
  const navigate = useNavigate();

  const { data: featuredEvents = [], isLoading } = useQuery({
    queryKey: ["featured-events-home"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as Event[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold text-foreground">Eventos em Destaque</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (featuredEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif font-semibold text-foreground">Eventos em Destaque</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/events")} className="text-primary">
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Mobile Layout - Compact horizontal cards */}
      <div className="space-y-3 md:hidden">
        {featuredEvents.map((event) => {
          const config = getEventConfig(event.event_type);
          const Icon = config.icon;

          return (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] overflow-hidden bg-card/60 backdrop-blur-md border-border/40"
              onClick={() => navigate(`/events?event=${event.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {event.image_url ? (
                    <div className="w-24 h-24 shrink-0 overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-24 h-24 shrink-0 flex items-center justify-center",
                      config.bgColor
                    )}>
                      <Icon className={cn("w-8 h-8", config.color)} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 py-4 pr-4">
                    <h3 className="font-semibold text-foreground truncate text-base leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/80">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                        <Calendar className="w-3 h-3 text-primary" />
                        {format(new Date(event.start_date + "T00:00:00"), "dd MMM", { locale: ptBR })}
                      </span>
                      {event.start_time && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/5 border border-secondary/10">
                          <Clock className="w-3 h-3 text-secondary" />
                          {event.start_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/70">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Layout - Side by side cards with full images */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {featuredEvents.map((event) => {
          const config = getEventConfig(event.event_type);
          const Icon = config.icon;
          const status = getRegistrationStatus(event);

          return (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1.5 overflow-hidden group border-border/40 bg-card/60 backdrop-blur-md"
              onClick={() => navigate(`/events?event=${event.id}`)}
            >
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center bg-gradient-to-br",
                    config.bgColor.replace('bg-', 'from-').replace('/10', '/20'),
                    "to-background"
                  )}>
                    <Icon className={cn("w-16 h-16 opacity-40 group-hover:scale-110 transition-transform duration-500", config.color)} />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                {/* Registration Status Badge */}
                {status && (
                  <Badge
                    className={cn(
                      "absolute top-4 left-4 backdrop-blur-md border-0",
                      status.variant === "default"
                        ? "bg-primary/90 text-primary-foreground"
                        : "bg-background/80 text-muted-foreground"
                    )}
                  >
                    {status.label}
                  </Badge>
                )}
              </div>

              {/* Content Section */}
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/90">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        <span>
                          {format(new Date(event.start_date + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground/90">
                          <Clock className="w-4 h-4 text-secondary/70" />
                          <span>{event.start_time.slice(0, 5)}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};