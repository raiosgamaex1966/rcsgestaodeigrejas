import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Share2, CheckCircle, XCircle, Loader2, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Event, useEventAttendees, useUserAttendance, useConfirmAttendance, useCancelAttendance } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { getEventConfig } from "./EventTypeBadge";
import { AttendeesList } from "./AttendeesList";
import { ShareEventSheet } from "./ShareEventSheet";

interface EventDetailModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailModal = ({ event, open, onOpenChange }: EventDetailModalProps) => {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const { data: attendees } = useEventAttendees(event?.id || "");
  const { data: userAttendance, isLoading: isLoadingAttendance } = useUserAttendance(event?.id || "", user?.id);
  const confirmAttendance = useConfirmAttendance();
  const cancelAttendance = useCancelAttendance();

  if (!event) return null;

  const config = getEventConfig(event.event_type);
  const Icon = config.icon;
  const isAttending = !!userAttendance;

  const handleToggleAttendance = async () => {
    if (!user) {
      toast.error("Faça login para confirmar presença");
      return;
    }

    if (isAttending) {
      await cancelAttendance.mutateAsync({ eventId: event.id, userId: user.id });
    } else {
      await confirmAttendance.mutateAsync({ eventId: event.id, userId: user.id });
    }
  };

  const handleAddToCalendar = () => {
    const startDateTime = event.start_time 
      ? `${event.start_date}T${event.start_time}` 
      : `${event.start_date}T00:00:00`;
    const endDateTime = event.end_time 
      ? `${event.start_date}T${event.end_time}` 
      : `${event.start_date}T23:59:59`;

    const formatICSDate = (dateStr: string) => {
      return new Date(dateStr).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const eventUrl = `${window.location.origin}/events?event=${event.id}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Igreja//Eventos//PT",
      "BEGIN:VEVENT",
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(endDateTime)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ""}`,
      `LOCATION:${event.location || ""}`,
      `URL:${eventUrl}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Evento adicionado à sua agenda!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {/* Event Image */}
          {event.image_url ? (
            <div className="relative w-full aspect-video">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
              {event.is_featured && (
                <span className="absolute top-3 right-3 text-xs bg-gold text-white px-2 py-1 rounded font-medium">
                  Destaque
                </span>
              )}
            </div>
          ) : (
            <div className={cn("relative w-full aspect-video flex items-center justify-center rounded-t-lg", config.bgColor)}>
              <Icon className={cn("w-16 h-16 opacity-30", config.color)} />
              {event.is_featured && (
                <span className="absolute top-3 right-3 text-xs bg-gold text-white px-2 py-1 rounded font-medium">
                  Destaque
                </span>
              )}
            </div>
          )}

          <div className="p-6 space-y-4">
            <DialogHeader className="text-left p-0">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", config.bgColor, config.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                  <DialogTitle className="text-xl font-serif">{event.title}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            {/* Event Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(new Date(event.start_date + "T00:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              {event.start_time && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {event.start_time.slice(0, 5)}
                  {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {event.location}
                </div>
              )}
            </div>

            {/* Attendees */}
            <div className="pt-3 border-t border-border">
              <h4 className="font-medium text-sm mb-3">Quem vai</h4>
              <AttendeesList eventId={event.id} maxDisplay={6} />
            </div>

            {/* Description */}
            {event.description && (
              <div className="pt-3 border-t border-border">
                <h4 className="font-medium text-sm mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant={isAttending ? "outline" : "default"}
                className="w-full"
                onClick={handleToggleAttendance}
                disabled={confirmAttendance.isPending || cancelAttendance.isPending || isLoadingAttendance}
              >
                {(confirmAttendance.isPending || cancelAttendance.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isAttending ? (
                  <XCircle className="w-4 h-4 mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isAttending ? "Cancelar Presença" : "Confirmar Presença"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareEventSheet 
        event={event} 
        open={shareOpen} 
        onOpenChange={setShareOpen} 
      />
    </>
  );
};
