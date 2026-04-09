import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, FileText, Repeat } from "lucide-react";
import { Event } from "@/hooks/useEvents";

interface EventGeneralTabProps {
  event: Event;
}

export const EventGeneralTab = ({ event }: EventGeneralTabProps) => {
  const contactPhone = (event as any).contact_phone;
  const contactEmail = (event as any).contact_email;
  const organizerNotes = (event as any).organizer_notes;

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Descrição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.description ? (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          ) : (
            <p className="text-muted-foreground italic">Nenhuma descrição adicionada.</p>
          )}
        </CardContent>
      </Card>

      {/* Location & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Local e Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Local</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-muted-foreground">{contactPhone}</p>
              </div>
            </div>
          )}
          {contactEmail && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{contactEmail}</p>
              </div>
            </div>
          )}
          {!event.location && !contactPhone && !contactEmail && (
            <p className="text-muted-foreground italic">Nenhuma informação de contato.</p>
          )}
        </CardContent>
      </Card>

      {/* Recurrence */}
      {event.is_recurring && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Recorrência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.recurrence_pattern === "weekly" && "Evento semanal"}
              {event.recurrence_pattern === "monthly" && "Evento mensal"}
              {event.recurrence_day !== null && event.recurrence_pattern === "weekly" && (
                <span>
                  {" "}• Toda{" "}
                  {["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][event.recurrence_day]}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      {organizerNotes && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notas Internas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{organizerNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
