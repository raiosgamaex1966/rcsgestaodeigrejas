import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, QrCode, Copy } from "lucide-react";
import { toast } from "sonner";
import { useChurchSettings } from "@/hooks/useChurchSettings";

interface PublicEventPaymentProps {
  isPaid: boolean;
  price: number | null;
  paymentType: string | null;
  paymentExternalUrl: string | null;
  paymentInstructions: string | null;
  // Custom event PIX fields
  eventPixKey?: string | null;
  eventPixKeyType?: string | null;
  eventPixBeneficiary?: string | null;
  eventPixQrcodeUrl?: string | null;
}

export const PublicEventPayment = ({
  isPaid,
  price,
  paymentType,
  paymentExternalUrl,
  paymentInstructions,
  eventPixKey,
  eventPixBeneficiary,
  eventPixQrcodeUrl,
}: PublicEventPaymentProps) => {
  const { settings: churchSettings } = useChurchSettings();

  if (!isPaid || !price) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Determine which PIX to use - event specific or global church settings
  const hasEventPix = !!eventPixKey;
  const pixKey = hasEventPix ? eventPixKey : churchSettings?.pix_key;
  const pixBeneficiary = hasEventPix ? eventPixBeneficiary : churchSettings?.pix_beneficiary_name;
  const pixQrcodeUrl = hasEventPix ? eventPixQrcodeUrl : churchSettings?.pix_qrcode_url;

  const copyPixKey = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      toast.success("Chave PIX copiada!");
    }
  };

  const showPix = paymentType === "pix" || paymentType === "both";
  const showExternal = paymentType === "external" || paymentType === "both";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Investimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-primary">
          {formatCurrency(price)}
        </div>

        {paymentInstructions && (
          <p className="text-sm text-muted-foreground">
            {paymentInstructions}
          </p>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium">Formas de pagamento:</p>

          {showPix && pixKey && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="font-medium">PIX</span>
              </div>
              
              {pixQrcodeUrl && (
                <div className="flex justify-center">
                  <img 
                    src={pixQrcodeUrl} 
                    alt="QR Code PIX" 
                    className="w-40 h-40 rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-background rounded text-sm truncate">
                  {pixKey}
                </code>
                <Button variant="outline" size="sm" onClick={copyPixKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {pixBeneficiary && (
                <p className="text-sm text-muted-foreground">
                  Beneficiário: {pixBeneficiary}
                </p>
              )}
            </div>
          )}

          {showExternal && paymentExternalUrl && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.open(paymentExternalUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pagar via Site Externo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};