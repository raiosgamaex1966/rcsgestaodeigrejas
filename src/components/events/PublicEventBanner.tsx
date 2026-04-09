import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Ticket } from "lucide-react";

interface PublicEventBannerProps {
  imageUrl: string | null;
  registrationStatus: string | null;
  registrationLimit: number | null;
  currentRegistrations: number;
  registrationDeadline: string | null;
}

export const PublicEventBanner = ({
  imageUrl,
  registrationStatus,
  registrationLimit,
  currentRegistrations,
  registrationDeadline,
}: PublicEventBannerProps) => {
  const getStatusBadge = () => {
    const now = new Date();
    const deadline = registrationDeadline ? new Date(registrationDeadline) : null;
    const isAfterDeadline = deadline && now > deadline;
    const isFull = registrationLimit && currentRegistrations >= registrationLimit;

    if (registrationStatus === "none") {
      return {
        label: "Entrada Livre",
        variant: "secondary" as const,
        icon: Ticket,
        className: "bg-blue-500/90 text-white border-0",
      };
    }

    if (registrationStatus === "closed" || isAfterDeadline) {
      return {
        label: "Inscrições Encerradas",
        variant: "secondary" as const,
        icon: XCircle,
        className: "bg-muted text-muted-foreground border-0",
      };
    }

    if (isFull) {
      return {
        label: "Esgotado",
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-destructive text-destructive-foreground border-0",
      };
    }

    return {
      label: "Inscrições Abertas",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-green-500/90 text-white border-0",
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden rounded-xl">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Banner do evento"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <Ticket className="h-24 w-24 text-primary/40" />
        </div>
      )}
      
      {/* Status Badge */}
      <div className="absolute top-4 left-4">
        <Badge className={`${status.className} text-sm px-3 py-1.5 shadow-lg`}>
          <StatusIcon className="h-4 w-4 mr-1.5" />
          {status.label}
        </Badge>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
};
