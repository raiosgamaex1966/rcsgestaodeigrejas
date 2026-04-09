import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Settings, Phone, Mail, FileText, Loader2, Link, Copy, ExternalLink } from "lucide-react";
import { Event, useUpdateEvent } from "@/hooks/useEvents";
import { toast } from "sonner";

interface EventSettingsTabProps {
  event: Event;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);
};

export const EventSettingsTab = ({ event }: EventSettingsTabProps) => {
  const updateEvent = useUpdateEvent();
  
  const [formData, setFormData] = useState({
    registration_status: event.registration_status || "none",
    registration_limit: event.registration_limit?.toString() || "",
    registration_deadline: event.registration_deadline || "",
    contact_phone: event.contact_phone || "",
    contact_email: event.contact_email || "",
    organizer_notes: event.organizer_notes || "",
    public_slug: event.public_slug || "",
    allow_public_registration: event.allow_public_registration ?? true,
  });

  useEffect(() => {
    setFormData({
      registration_status: event.registration_status || "none",
      registration_limit: event.registration_limit?.toString() || "",
      registration_deadline: event.registration_deadline || "",
      contact_phone: event.contact_phone || "",
      contact_email: event.contact_email || "",
      organizer_notes: event.organizer_notes || "",
      public_slug: event.public_slug || "",
      allow_public_registration: event.allow_public_registration ?? true,
    });
  }, [event]);

  const handleGenerateSlug = async () => {
    const slug = generateSlug(event.title);
    setFormData({ ...formData, public_slug: slug });
    
    // Auto-save the generated slug
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        public_slug: slug,
      });
      toast.success("Slug gerado e salvo!");
    } catch (error) {
      toast.error("Erro ao salvar o slug");
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/evento/${formData.public_slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const openPublicLink = () => {
    window.open(`/evento/${formData.public_slug}`, "_blank");
  };

  const handleSave = async () => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        registration_status: formData.registration_status,
        registration_limit: formData.registration_limit ? parseInt(formData.registration_limit) : null,
        registration_deadline: formData.registration_deadline || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        organizer_notes: formData.organizer_notes || null,
        public_slug: formData.public_slug || null,
        allow_public_registration: formData.allow_public_registration,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Inscrição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Status das Inscrições</Label>
            <RadioGroup
              value={formData.registration_status}
              onValueChange={(value) => setFormData({ ...formData, registration_status: value })}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="font-normal cursor-pointer">
                  Sem inscrição
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open" className="font-normal cursor-pointer">
                  Inscrições abertas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="closed" id="closed" />
                <Label htmlFor="closed" className="font-normal cursor-pointer">
                  Inscrições encerradas
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.registration_status !== "none" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limit">Limite de vagas</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="Sem limite"
                  value={formData.registration_limit}
                  onChange={(e) => setFormData({ ...formData, registration_limit: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para vagas ilimitadas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Data limite para inscrições</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.registration_deadline?.slice(0, 16) || ""}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="w-5 h-5" />
            Link Público do Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug do evento</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder="meu-evento-2025"
                value={formData.public_slug}
                onChange={(e) => setFormData({ ...formData, public_slug: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                Gerar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O slug é usado na URL pública: /evento/{formData.public_slug || "seu-slug"}
            </p>
          </div>

          {formData.public_slug && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyPublicLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              <Button variant="outline" size="sm" onClick={openPublicLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Página
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="allowPublic"
              checked={formData.allow_public_registration}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_public_registration: checked })}
            />
            <Label htmlFor="allowPublic" className="cursor-pointer">
              Permitir inscrições públicas (sem login)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="eventos@igreja.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notas Internas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Anotações internas (não visíveis para os participantes)..."
            value={formData.organizer_notes}
            onChange={(e) => setFormData({ ...formData, organizer_notes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateEvent.isPending}>
          {updateEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
