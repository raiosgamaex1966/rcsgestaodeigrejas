import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, ExternalLink, QrCode, Save, Loader2 } from "lucide-react";
import { useUpdateEvent, Event } from "@/hooks/useEvents";

interface EventPaymentTabProps {
  event: Event;
}

export const EventPaymentTab = ({ event }: EventPaymentTabProps) => {
  const [isPaid, setIsPaid] = useState(event.is_paid || false);
  const [price, setPrice] = useState(event.price?.toString() || "");
  const [paymentType, setPaymentType] = useState(event.payment_type || "external");
  const [useGlobalPix, setUseGlobalPix] = useState(paymentType === "pix" || paymentType === "both");
  const [useEventPix, setUseEventPix] = useState(!!event.event_pix_key);
  const [useExternal, setUseExternal] = useState(paymentType === "external" || paymentType === "both");
  const [paymentExternalUrl, setPaymentExternalUrl] = useState(event.payment_external_url || "");
  const [paymentInstructions, setPaymentInstructions] = useState(event.payment_instructions || "");
  
  // Custom PIX fields
  const [eventPixKey, setEventPixKey] = useState(event.event_pix_key || "");
  const [eventPixKeyType, setEventPixKeyType] = useState(event.event_pix_key_type || "CNPJ");
  const [eventPixBeneficiary, setEventPixBeneficiary] = useState(event.event_pix_beneficiary || "");
  const [eventPixQrcodeUrl, setEventPixQrcodeUrl] = useState(event.event_pix_qrcode_url || "");

  const updateEvent = useUpdateEvent();

  useEffect(() => {
    let type = "external";
    if (useEventPix || useGlobalPix) {
      if (useExternal) {
        type = "both";
      } else {
        type = "pix";
      }
    } else if (useExternal) {
      type = "external";
    }
    setPaymentType(type);
  }, [useGlobalPix, useEventPix, useExternal]);

  const handleSave = () => {
    updateEvent.mutate({
      id: event.id,
      is_paid: isPaid,
      price: isPaid && price ? parseFloat(price) : null,
      payment_type: paymentType,
      payment_external_url: paymentExternalUrl || null,
      payment_instructions: paymentInstructions || null,
      event_pix_key: useEventPix ? eventPixKey || null : null,
      event_pix_key_type: useEventPix ? eventPixKeyType : null,
      event_pix_beneficiary: useEventPix ? eventPixBeneficiary || null : null,
      event_pix_qrcode_url: useEventPix ? eventPixQrcodeUrl || null : null,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tipo de Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={isPaid ? "paid" : "free"}
            onValueChange={(value) => setIsPaid(value === "paid")}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="free"
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                !isPaid ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="free" id="free" />
              <div>
                <p className="font-medium">Gratuito</p>
                <p className="text-sm text-muted-foreground">Sem cobrança</p>
              </div>
            </Label>

            <Label
              htmlFor="paid"
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                isPaid ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="paid" id="paid" />
              <div>
                <p className="font-medium">Pago</p>
                <p className="text-sm text-muted-foreground">Com valor definido</p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {isPaid && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Valor da Inscrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="price">Valor (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50.00"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="useGlobalPix"
                  checked={useGlobalPix}
                  onCheckedChange={(checked) => {
                    setUseGlobalPix(checked === true);
                    if (checked) setUseEventPix(false);
                  }}
                />
                <Label htmlFor="useGlobalPix" className="flex items-center gap-2 cursor-pointer">
                  <QrCode className="h-4 w-4" />
                  PIX da Igreja (configuração global)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="useEventPix"
                  checked={useEventPix}
                  onCheckedChange={(checked) => {
                    setUseEventPix(checked === true);
                    if (checked) setUseGlobalPix(false);
                  }}
                />
                <Label htmlFor="useEventPix" className="flex items-center gap-2 cursor-pointer">
                  <QrCode className="h-4 w-4" />
                  PIX Personalizado (específico do evento)
                </Label>
              </div>

              {useEventPix && (
                <div className="ml-7 space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pixKeyType">Tipo de Chave</Label>
                      <Select value={eventPixKeyType} onValueChange={setEventPixKeyType}>
                        <SelectTrigger id="pixKeyType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Telefone</SelectItem>
                          <SelectItem value="RANDOM">Chave aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pixKey">Chave PIX</Label>
                      <Input
                        id="pixKey"
                        value={eventPixKey}
                        onChange={(e) => setEventPixKey(e.target.value)}
                        placeholder="Sua chave PIX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pixBeneficiary">Nome do Beneficiário</Label>
                    <Input
                      id="pixBeneficiary"
                      value={eventPixBeneficiary}
                      onChange={(e) => setEventPixBeneficiary(e.target.value)}
                      placeholder="Nome que aparece no comprovante"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pixQrcode">URL do QR Code (opcional)</Label>
                    <Input
                      id="pixQrcode"
                      type="url"
                      value={eventPixQrcodeUrl}
                      onChange={(e) => setEventPixQrcodeUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole a URL de uma imagem do QR Code do PIX
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="useExternal"
                  checked={useExternal}
                  onCheckedChange={(checked) => setUseExternal(checked === true)}
                />
                <Label htmlFor="useExternal" className="flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="h-4 w-4" />
                  Link Externo (PagSeguro, Sympla, etc.)
                </Label>
              </div>

              {useExternal && (
                <div className="space-y-2 ml-7">
                  <Label htmlFor="externalUrl">Link de Pagamento</Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    value={paymentExternalUrl}
                    onChange={(e) => setPaymentExternalUrl(e.target.value)}
                    placeholder="https://pag.ae/seu-evento"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Após o pagamento, envie o comprovante para o WhatsApp (00) 00000-0000..."
                rows={3}
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateEvent.isPending}>
          {updateEvent.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};