import { Event } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, ChevronRight, Users, Church, BookOpen, Music, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEventAttendees } from "@/hooks/useEvents";

interface EventGridCardProps {
  event: Event;
  onClick: () => void;
}

const eventTypeIcons: Record<string, React.ElementType> = {
  culto: Church,
  celula: Users,
  estudo: BookOpen,
  louvor: Music,
  social: Heart,
  outro: Star,
};

const getRegistrationStatus = (event: Event, attendeesCount: number) => {
  const now = new Date();
  
  if (event.registration_deadline) {
    const deadline = parseISO(event.registration_deadline);
    if (now > deadline) {
      return { label: "Encerradas", variant: "secondary" as const };
    }
  }
  
  if (event.registration_limit && attendeesCount >= event.registration_limit) {
    return { label: "Esgotado", variant: "destructive" as const };
  }
  
  if (event.registration_status === "open") {
    return { label: "Inscrições Abertas", variant: "default" as const };
  }
  
  return null;
};

export const EventGridCard = ({ event, onClick }: EventGridCardProps) => {
  const { data: attendees } = useEventAttendees(event.id);
  const attendeesCount = attendees?.length || 0;
  const status = getRegistrationStatus(event, attendeesCount);
  
  const EventIcon = eventTypeIcons[event.event_type] || Star;
  
  const formattedStartDate = format(parseISO(event.start_date), "dd MMM", { locale: ptBR });
  const formattedStartTime = event.start_time?.slice(0, 5) || "";
  const formattedEndDate = event.end_date 
    ? format(parseISO(event.end_date), "dd MMM", { locale: ptBR })
    : null;
  const formattedEndTime = event.end_time?.slice(0, 5) || "";

  return (
    <div 
      onClick={onClick}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <EventIcon className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Status Badge */}
        {status && (
          <Badge 
            variant={status.variant}
            className="absolute top-3 left-3 text-xs font-medium"
          >
            {status.label}
          </Badge>
        )}
        
        {/* Featured Badge */}
        {event.is_featured && (
          <Badge 
            className="absolute top-3 right-3 bg-gold text-gold-foreground text-xs font-medium"
          >
            Destaque
          </Badge>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Start Date/Time */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {formattedStartDate} {formattedStartTime && `às ${formattedStartTime}`}
            </span>
          </div>
          
          {/* End Date/Time */}
          {(formattedEndDate || formattedEndTime) && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-muted-foreground/70">
                até {formattedEndDate} {formattedEndTime && `às ${formattedEndTime}`}
              </span>
            </div>
          )}
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground/70" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>
        
        {/* Arrow indicator */}
        <div className="flex justify-end pt-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};
