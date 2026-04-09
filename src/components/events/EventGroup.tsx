import { Event } from "@/hooks/useEvents";
import { CompactEventCard } from "./CompactEventCard";
import { FeaturedEventCard } from "./FeaturedEventCard";
import { EventGridCard } from "./EventGridCard";

interface EventGroupProps {
  title: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  showFeatured?: boolean;
  showDate?: boolean;
}

export const EventGroup = ({ 
  title, 
  events, 
  onEventClick, 
  showFeatured = false,
  showDate = false
}: EventGroupProps) => {
  if (events.length === 0) return null;

  // Find featured event if showing featured
  const featuredEvent = showFeatured ? events.find(e => e.is_featured) : null;
  const regularEvents = featuredEvent 
    ? events.filter(e => e.id !== featuredEvent.id) 
    : events;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-lg">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {events.length} {events.length === 1 ? "evento" : "eventos"}
        </span>
      </div>
      
      {/* Featured Event Card (both layouts) */}
      {featuredEvent && (
        <FeaturedEventCard 
          event={featuredEvent} 
          onClick={() => onEventClick(featuredEvent)} 
        />
      )}
      
      {/* Mobile Layout - Vertical compact cards */}
      <div className="space-y-3 md:hidden">
        {regularEvents.map((event) => (
          <CompactEventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
            showDate={showDate}
          />
        ))}
      </div>
      
      {/* Tablet/Desktop Layout - Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regularEvents.map((event) => (
          <EventGridCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
};
