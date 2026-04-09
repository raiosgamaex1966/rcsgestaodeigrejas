import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { useCreateEventRegistration } from "@/hooks/useEventRegistrations";

interface PublicEventFormProps {
  eventId: string;
  isDisabled: boolean;
  disabledReason?: string;
}

export const PublicEventForm = ({
  eventId,
  isDisabled,
  disabledReason,
}: PublicEventFormProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const createRegistration = useCreateEventRegistration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createRegistration.mutateAsync({
        event_id: eventId,
        full_name: fullName,
        email,
        phone: phone || null,
        notes: notes || null,
        payment_status: "pending",
        payment_proof_url: null,
      });
      setIsSuccess(true);
    } catch (error) {
      // Error handled by the mutation
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Inscrição Confirmada!</h3>
            <p className="text-muted-foreground">
              Sua inscrição foi realizada com sucesso. Você receberá mais informações no email {email}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-primary" />
          Fazer Inscrição
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isDisabled ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>{disabledReason || "Inscrições não disponíveis"}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma informação adicional?"
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createRegistration.isPending}
            >
              {createRegistration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Inscrição
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
