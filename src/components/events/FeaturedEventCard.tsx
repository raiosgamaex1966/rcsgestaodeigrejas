import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, ChevronRight, Star, Users } from "lucide-react";
import { Event, useEventAttendees } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";

interface FeaturedEventCardProps {
  event: Event;
  onClick: () => void;
}

const getRegistrationStatus = (event: Event, attendeesCount: number) => {
  if (event.registration_status === "closed") {
    return { label: "Inscrições Encerradas", color: "bg-gray-500/90" };
  }
  
  if (!event.registration_limit) {
    if (event.allow_public_registration) {
      return { label: "Inscrições Abertas", color: "bg-emerald-500" };
    }
    return null;
  }

  const spotsLeft = event.registration_limit - attendeesCount;
  const percentFilled = (attendeesCount / event.registration_limit) * 100;

  if (spotsLeft <= 0) {
    return { label: "Esgotado", color: "bg-red-500" };
  }
  
  if (percentFilled >= 80) {
    return { label: `Últimas ${spotsLeft} vagas`, color: "bg-amber-500" };
  }

  if (event.allow_public_registration) {
    return { label: "Inscrições Abertas", color: "bg-emerald-500" };
  }

  return null;
};

export const FeaturedEventCard = ({ event, onClick }: FeaturedEventCardProps) => {
  const eventDate = new Date(event.start_date + "T00:00:00");
  
  const { data: attendees } = useEventAttendees(event.id);
  const attendeesCount = attendees?.length || 0;
  const registrationStatus = getRegistrationStatus(event, attendeesCount);
  
  const defaultImage = "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80";
  const imageUrl = event.image_url || defaultImage;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden bg-card border border-border shadow-lg hover:shadow-xl transition-all group"
    >
      {/* Image Section */}
      <div className="relative h-44 sm:h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {/* Registration Status Badge */}
          {registrationStatus && (
            <span className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white",
              registrationStatus.color
            )}>
              <Users className="w-3 h-3" />
              {registrationStatus.label}
            </span>
          )}
          
          {/* Featured Badge */}
          {event.is_featured && (
            <span className="flex items-center gap-1 bg-yellow-500 text-black px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ml-auto">
              <Star className="w-3 h-3 fill-current" />
              Destaque
            </span>
          )}
        </div>
        
        {/* Content on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-1 line-clamp-2">
            {event.title}
          </h3>
          {event.location && (
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Info Card */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {format(eventDate, "dd MMM", { locale: ptBR })}
            {event.start_time && ` • ${event.start_time.slice(0, 5)}`}
            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
};
