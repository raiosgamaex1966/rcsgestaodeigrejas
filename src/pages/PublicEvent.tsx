import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicEventBanner } from "@/components/events/PublicEventBanner";
import { PublicEventPayment } from "@/components/events/PublicEventPayment";
import { PublicEventForm } from "@/components/events/PublicEventForm";
import { usePublicEventBySlug, useEventRegistrationCount } from "@/hooks/useEventRegistrations";
import { toast } from "sonner";

const PublicEvent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = usePublicEventBySlug(slug || "");
  const { data: registrationCount = 0 } = useEventRegistrationCount(event?.id || "");

  const handleShare = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/og-meta?type=evento&slug=${event?.public_slug}`;

    if (navigator.share) {
      await navigator.share({
        title: event?.title,
        text: event?.description || "",
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Evento não encontrado</h1>
          <p className="text-muted-foreground">
            Este evento não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + "T00:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    return timeStr.slice(0, 5);
  };

  const now = new Date();
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isAfterDeadline = deadline && now > deadline;
  const isFull = event.registration_limit && registrationCount >= event.registration_limit;
  const isClosed = event.registration_status === "closed";
  const isRegistrationDisabled = isAfterDeadline || isFull || isClosed || event.registration_status === "none";

  let disabledReason = "";
  if (event.registration_status === "none") {
    disabledReason = "Este evento não requer inscrição prévia.";
  } else if (isClosed) {
    disabledReason = "As inscrições para este evento estão encerradas.";
  } else if (isAfterDeadline) {
    disabledReason = "O prazo para inscrições já foi encerrado.";
  } else if (isFull) {
    disabledReason = "As vagas para este evento estão esgotadas.";
  }

  const spotsRemaining = event.registration_limit
    ? event.registration_limit - registrationCount
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 space-y-6 pb-12">
        {/* Banner with Status Badge */}
        <PublicEventBanner
          imageUrl={event.image_url}
          registrationStatus={event.registration_status}
          registrationLimit={event.registration_limit}
          currentRegistrations={registrationCount}
          registrationDeadline={event.registration_deadline}
        />

        {/* Event Title & Description */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {event.description && (
            <p className="text-muted-foreground">{event.description}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-5 w-5 text-primary" />
            <span>{formatDate(event.start_date)}</span>
            {event.end_date && event.end_date !== event.start_date && (
              <span>até {formatDate(event.end_date)}</span>
            )}
          </div>

          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-5 w-5 text-primary" />
              <span>
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{event.location}</span>
            </div>
          )}

          {event.registration_limit && (
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-5 w-5 text-primary" />
              <span>
                {spotsRemaining !== null && spotsRemaining > 0
                  ? `${spotsRemaining} vagas restantes`
                  : spotsRemaining === 0
                    ? "Vagas esgotadas"
                    : `${event.registration_limit} vagas`
                }
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Payment Section */}
        <PublicEventPayment
          isPaid={event.is_paid || false}
          price={event.price}
          paymentType={event.payment_type}
          paymentExternalUrl={event.payment_external_url}
          paymentInstructions={event.payment_instructions}
          eventPixKey={event.event_pix_key}
          eventPixKeyType={event.event_pix_key_type}
          eventPixBeneficiary={event.event_pix_beneficiary}
          eventPixQrcodeUrl={event.event_pix_qrcode_url}
        />

        {/* Registration Form */}
        {event.allow_public_registration !== false && (
          <PublicEventForm
            eventId={event.id}
            isDisabled={isRegistrationDisabled}
            disabledReason={disabledReason}
          />
        )}

        {/* Registration Count */}
        {registrationCount > 0 && event.registration_status !== "none" && (
          <div className="text-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 inline mr-1" />
            {registrationCount} {registrationCount === 1 ? "pessoa já se inscreveu" : "pessoas já se inscreveram"}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicEvent;
