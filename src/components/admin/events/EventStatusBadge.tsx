import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface EventStatusBadgeProps {
  status: string;
  registrationLimit?: number | null;
  attendeesCount?: number;
}

export const EventStatusBadge = ({ 
  status, 
  registrationLimit, 
  attendeesCount = 0 
}: EventStatusBadgeProps) => {
  const isFull = registrationLimit && attendeesCount >= registrationLimit;
  
  if (status === "none") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Users className="w-3 h-3" />
        Sem inscrição
      </Badge>
    );
  }
  
  if (status === "closed" || isFull) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        {isFull ? "Lotado" : "Inscrições Encerradas"}
      </Badge>
    );
  }
  
  return (
    <Badge className="gap-1 bg-green-600 hover:bg-green-700">
      <CheckCircle className="w-3 h-3" />
      Inscrições Abertas
    </Badge>
  );
};
