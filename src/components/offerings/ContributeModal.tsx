import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Campaign } from "@/hooks/useCampaigns";
import { Copy, QrCode, Building2, CreditCard, Heart, Church, Gift, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useContributions } from "@/hooks/useContributions";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useAuth } from "@/hooks/useAuth";
import * as LucideIcons from "lucide-react";
import { useState } from "react";

interface ContributeModalProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_VALUES = [50, 100, 200, 500];

const CONTRIBUTION_TYPES = [
  { id: "tithe", label: "Dízimo", icon: Church, description: "10% da sua renda" },
  { id: "offering", label: "Oferta", icon: Gift, description: "Oferta voluntária" },
  { id: "campaign", label: "Campanha", icon: Heart, description: "Para esta campanha" },
];

export const ContributeModal = ({ campaign, open, onOpenChange }: ContributeModalProps) => {
  const { settings } = useTheme();
  const { user } = useAuth();
  const { createContribution } = useContributions();
  const { incomeCategories } = useFinancialCategories();
  
  const [step, setStep] = useState<"type" | "value" | "payment" | "success">("type");
  const [selectedType, setSelectedType] = useState("campaign");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!campaign) return null;

  const resetAndClose = () => {
    setStep("type");
    setSelectedType("campaign");
    setAmount("");
    onOpenChange(false);
  };

  const handleConfirmContribution = async () => {
    if (!amount || isNaN(Number(amount))) return;
    
    setIsSubmitting(true);
    try {
      // Find category based on type
      const categoryName = selectedType === "tithe" ? "Dízimo" : selectedType === "offering" ? "Oferta" : null;
      const category = categoryName 
        ? incomeCategories?.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()))
        : null;

      await createContribution.mutateAsync({
        amount: Number(amount),
        category_id: category?.id,
        campaign_id: selectedType === "campaign" ? campaign.id : undefined,
        payment_method: "pix",
        description: selectedType === "campaign" ? `Contribuição para ${campaign.title}` : undefined,
      });
      
      setStep("success");
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which payment info to use (campaign-specific or global)
  const useGlobal = campaign.use_global_pix;
  const pixKey = useGlobal ? settings?.pix_key : campaign.pix_key;
  const pixKeyType = useGlobal ? settings?.pix_key_type : campaign.pix_key_type;
  const pixBeneficiaryName = useGlobal ? (settings?.pix_beneficiary_name || settings?.church_name) : campaign.pix_beneficiary_name;
  const pixQrcodeUrl = useGlobal ? settings?.pix_qrcode_url : campaign.pix_qrcode_url;
  
  // Bank info (only for campaign-specific)
  const hasBankInfo = !useGlobal && (campaign.bank_name || campaign.bank_account);
  
  const percentage = campaign.goal_amount > 0 
    ? Math.round((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100)
    : 0;
  
  const Icon = (LucideIcons as any)[campaign.icon] || LucideIcons.Heart;
  
  const copyPix = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no seu aplicativo de pagamento",
      });
    }
  };
  
  const copyBankInfo = () => {
    const info = `Banco: ${campaign.bank_name}\nAgência: ${campaign.bank_agency}\nConta: ${campaign.bank_account}\nTitular: ${campaign.bank_holder_name}`;
    navigator.clipboard.writeText(info);
    toast({
      title: "Dados bancários copiados!",
      description: "Cole onde precisar",
    });
  };

  // Success step
  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-md">
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Contribuição Registrada!</h3>
            <p className="text-muted-foreground">
              Obrigado pela sua generosidade. Que Deus abençoe abundantemente sua vida!
            </p>
            <div className="p-4 bg-secondary/50 rounded-xl italic text-sm text-muted-foreground">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
              <p className="text-accent font-medium mt-1">2 Coríntios 9:7</p>
            </div>
            <Button onClick={resetAndClose} className="w-full">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Icon className="w-5 h-5 text-accent" />
            </div>
            {step === "type" && "Tipo de Contribuição"}
            {step === "value" && "Valor da Contribuição"}
            {step === "payment" && `Contribuir para ${campaign.title}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Step 1: Choose Type */}
          {step === "type" && user && (
            <>
              <p className="text-sm text-muted-foreground">
                Selecione o tipo de contribuição que deseja fazer:
              </p>
              <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-3">
                {CONTRIBUTION_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <label
                      key={type.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedType === type.id 
                          ? "border-accent bg-accent/5" 
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value={type.id} className="sr-only" />
                      <div className={`p-2 rounded-lg ${selectedType === type.id ? "bg-accent/20" : "bg-secondary"}`}>
                        <TypeIcon className={`w-5 h-5 ${selectedType === type.id ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {selectedType === type.id && (
                        <Check className="w-5 h-5 text-accent" />
                      )}
                    </label>
                  );
                })}
              </RadioGroup>
              <Button onClick={() => setStep("value")} className="w-full">
                Continuar
              </Button>
            </>
          )}

          {/* Step 2: Enter Value */}
          {step === "value" && (
            <>
              <div className="space-y-3">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold text-center h-14"
                  min="0"
                  step="0.01"
                />
                <div className="flex gap-2 flex-wrap">
                  {SUGGESTED_VALUES.map((value) => (
                    <Button
                      key={value}
                      variant={amount === value.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(value.toString())}
                      className="flex-1"
                    >
                      R$ {value}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("type")} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={() => setStep("payment")} 
                  disabled={!amount || Number(amount) <= 0}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Payment Info (or direct if no user) */}
          {(step === "payment" || !user) && (
            <>
              {/* Campaign Info */}
              {campaign.description && (
                <p className="text-sm text-muted-foreground">{campaign.description}</p>
              )}
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-gold rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Number(campaign.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="font-semibold text-accent">{percentage}%</span>
                  <span className="text-muted-foreground">
                    {Number(campaign.goal_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Show amount if user entered one */}
              {user && amount && (
                <div className="p-3 bg-accent/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">Valor da contribuição:</p>
                  <p className="text-2xl font-bold text-accent">
                    {Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              )}
              
              {/* PIX Section */}
              {pixKey && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-accent" />
                    PIX
                  </h3>
                  
                  <div className="p-4 bg-secondary rounded-xl text-center">
                    {pixQrcodeUrl ? (
                      <img
                        src={pixQrcodeUrl}
                        alt="QR Code PIX"
                        className="w-40 h-40 mx-auto object-contain mb-3 rounded-lg bg-white p-2"
                      />
                    ) : (
                      <div className="w-40 h-40 mx-auto bg-foreground/10 rounded-lg mb-3 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mb-1">{pixKeyType}</p>
                    <p className="font-mono text-sm font-medium text-foreground break-all">{pixKey}</p>
                    {pixBeneficiaryName && (
                      <p className="text-xs text-muted-foreground mt-1">{pixBeneficiaryName}</p>
                    )}
                  </div>
                  
                  <Button variant="gold" className="w-full" onClick={copyPix}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Chave PIX
                  </Button>
                </div>
              )}
              
              {/* Bank Info Section */}
              {hasBankInfo && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent" />
                    Transferência Bancária
                  </h3>
                  
                  <div className="p-4 bg-secondary rounded-xl space-y-2">
                    {campaign.bank_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Banco:</span>
                        <span className="font-medium text-foreground">{campaign.bank_name}</span>
                      </div>
                    )}
                    {campaign.bank_agency && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Agência:</span>
                        <span className="font-medium text-foreground">{campaign.bank_agency}</span>
                      </div>
                    )}
                    {campaign.bank_account && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conta:</span>
                        <span className="font-medium text-foreground">{campaign.bank_account}</span>
                      </div>
                    )}
                    {campaign.bank_holder_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Titular:</span>
                        <span className="font-medium text-foreground">{campaign.bank_holder_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" className="w-full" onClick={copyBankInfo}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Copiar Dados Bancários
                  </Button>
                </div>
              )}
              
              {/* No payment info warning */}
              {!pixKey && !hasBankInfo && (
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">
                    Informações de pagamento não configuradas para esta campanha.
                  </p>
                </div>
              )}

              {/* Confirm button for logged users */}
              {user && amount && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("value")} className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleConfirmContribution} 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Registrando..." : "Confirmar Contribuição"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
