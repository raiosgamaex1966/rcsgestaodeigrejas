import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, Calendar as CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Event } from "@/hooks/useEvents";

interface ShareEventSheetProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareEventSheet = ({ event, open, onOpenChange }: ShareEventSheetProps) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  // Use public page URL if public_slug exists, otherwise fallback to internal URL
  const eventUrl = event.public_slug 
    ? `${window.location.origin}/evento/${event.public_slug}`
    : `${window.location.origin}/events?event=${event.id}`;

  // URL for WhatsApp sharing that goes through og-meta edge function for rich preview
  const getWhatsAppShareUrl = () => {
    if (event.public_slug) {
      // Use edge function URL for rich preview with image
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-meta?type=evento&slug=${event.public_slug}`;
    }
    return eventUrl;
  };
  
  const formatEventDate = () => {
    return format(new Date(event.start_date + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const getShareText = () => {
    let text = `🎉 *${event.title}*\n\n`;
    text += `📅 ${formatEventDate()}\n`;
    if (event.start_time) {
      text += `⏰ ${event.start_time.slice(0, 5)}`;
      if (event.end_time) text += ` - ${event.end_time.slice(0, 5)}`;
      text += "\n";
    }
    if (event.location) {
      text += `📍 ${event.location}\n`;
    }
    if (event.description) {
      text += `\n${event.description.slice(0, 100)}${event.description.length > 100 ? "..." : ""}\n`;
    }
    // Use the og-meta URL so WhatsApp can fetch the preview
    text += `\n✅ Confirme sua presença:\n${getWhatsAppShareUrl()}`;
    return text;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = getShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    onOpenChange(false);
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
    
    toast.success("Arquivo de calendário baixado!");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-serif">Compartilhar Evento</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-3 pb-6">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={handleShareWhatsApp}
          >
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Enviar para contatos ou grupos</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={handleCopyLink}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {copied ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium">{copied ? "Copiado!" : "Copiar Link"}</p>
              <p className="text-xs text-muted-foreground">Compartilhe em qualquer lugar</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={handleAddToCalendar}
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-gold" />
            </div>
            <div className="text-left">
              <p className="font-medium">Adicionar à Agenda</p>
              <p className="text-xs text-muted-foreground">Google Calendar, Apple, Outlook</p>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
