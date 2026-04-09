import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Users } from "lucide-react";
import { Event, useEventAttendees } from "@/hooks/useEvents";
import { getEventConfig } from "./EventTypeBadge";
import { cn } from "@/lib/utils";

interface CompactEventCardProps {
  event: Event;
  onClick: () => void;
  showDate?: boolean;
}

const getRegistrationStatus = (event: Event, attendeesCount: number) => {
  // If registration is not open
  if (event.registration_status === "closed") {
    return { label: "Inscrições Encerradas", color: "bg-muted text-muted-foreground" };
  }
  
  // If there's no limit, registrations are open
  if (!event.registration_limit) {
    if (event.allow_public_registration) {
      return { label: "Inscrições Abertas", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    }
    return null;
  }

  const spotsLeft = event.registration_limit - attendeesCount;
  const percentFilled = (attendeesCount / event.registration_limit) * 100;

  if (spotsLeft <= 0) {
    return { label: "Esgotado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  
  if (percentFilled >= 80) {
    return { label: `Últimas ${spotsLeft} vagas`, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }

  if (event.allow_public_registration) {
    return { label: "Inscrições Abertas", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
  }

  return null;
};

export const CompactEventCard = ({ event, onClick, showDate = false }: CompactEventCardProps) => {
  const eventDate = new Date(event.start_date + "T00:00:00");
  const config = getEventConfig(event.event_type);
  const Icon = config.icon;
  
  const { data: attendees } = useEventAttendees(event.id);
  const attendeesCount = attendees?.length || 0;
  const registrationStatus = getRegistrationStatus(event, attendeesCount);

  const formatTime = () => {
    if (showDate) {
      const dateStr = format(eventDate, "dd MMM", { locale: ptBR }).toUpperCase();
      return event.start_time ? `${dateStr} • ${event.start_time.slice(0, 5)}` : dateStr;
    }
    return event.start_time ? event.start_time.slice(0, 5) : "";
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl bg-card border border-border overflow-hidden",
        "hover:border-primary/50 hover:shadow-md transition-all",
        "flex group"
      )}
    >
      {/* Event Image */}
      {event.image_url && (
        <div className="w-24 h-24 shrink-0 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      {/* Content */}
      <div className={cn(
        "flex-1 min-w-0 p-3 flex flex-col justify-center",
        !event.image_url && "flex-row items-start gap-3"
      )}>
        {/* If no image, show icon */}
        {!event.image_url && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            config.bgColor
          )}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
        )}
        
        <div className={cn("flex-1 min-w-0", !event.image_url && "")}>
          {/* Title and Time */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {event.title}
            </h4>
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {formatTime()}
            </span>
          </div>
          
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              config.bgColor,
              config.color
            )}>
              {config.label}
            </span>
            
            {registrationStatus && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                registrationStatus.color
              )}>
                {registrationStatus.label}
              </span>
            )}
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="text-xs line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
