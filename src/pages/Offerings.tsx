import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Copy, QrCode, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { useTheme } from "@/contexts/ThemeContext";
import { ContributeModal } from "@/components/offerings/ContributeModal";
import * as LucideIcons from "lucide-react";

const Offerings = () => {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { settings } = useTheme();
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const pixKey = settings?.pix_key || "00.000.000/0001-00";
  const pixKeyType = settings?.pix_key_type || "CNPJ";
  const pixBeneficiaryName = settings?.pix_beneficiary_name || settings?.church_name;
  const pixQrcodeUrl = settings?.pix_qrcode_url;
  const pixInstructions = settings?.pix_instructions || "Escaneie o QR Code ou copie a chave PIX para fazer sua contribuição";
  
  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Chave PIX copiada!",
      description: "Cole no seu aplicativo de pagamento",
    });
  };
  
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Heart;
    return Icon;
  };

  const handleContribute = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setModalOpen(true);
  };

  return (
    <div className="w-full max-w-lg md:max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-xl font-serif font-bold text-foreground">
            Dízimos & Ofertas
          </h1>
          <p className="text-sm text-muted-foreground">
            Contribua para a obra de Deus
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Verse */}
        <Card className="bg-gradient-to-br from-primary to-primary-foreground text-white animate-fade-in border-0 shadow-card">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-gold fill-gold" />
            </div>
            <p className="text-sm md:text-base italic mb-3 opacity-90 leading-relaxed font-serif">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
            </p>
            <p className="text-[10px] md:text-xs text-gold font-black uppercase tracking-[0.2em]">
              — 2 Coríntios 9:7
            </p>
          </CardContent>
        </Card>

        {/* PIX Section */}
        <Card className="animate-slide-up bg-card/40 backdrop-blur-md border-border/50 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <QrCode className="w-5 h-5 text-primary" />
              Contribuir via PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-secondary/50 rounded-2xl flex flex-col items-center">
              {pixQrcodeUrl ? (
                <div className="p-4 bg-white rounded-xl shadow-soft mb-4">
                  <img
                    src={pixQrcodeUrl}
                    alt="QR Code PIX"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-white/50 rounded-2xl mb-4 flex items-center justify-center border-2 border-dashed border-border/50">
                  <QrCode className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{pixKeyType}</p>
                <p className="font-mono text-sm md:text-base font-bold text-foreground break-all">{pixKey}</p>
                {pixBeneficiaryName && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{pixBeneficiaryName}</p>
                )}
              </div>
            </div>
            
            <Button variant="gold" className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-soft" onClick={copyPix}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Chave PIX
            </Button>
            
            <p className="text-[10px] text-muted-foreground text-center font-medium leading-relaxed italic">
              {pixInstructions}
            </p>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            Campanhas Ativas
          </h2>
          
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-4 border-border/50 bg-card/40">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </Card>
            ))
          ) : campaigns.length === 0 ? (
            <Card className="p-12 text-center bg-card/30 backdrop-blur-sm border-dashed border-2 border-border/50">
              <p className="text-muted-foreground font-medium italic">
                Nenhuma campanha ativa no momento.
              </p>
            </Card>
          ) : (
            campaigns.map((campaign, index) => {
              const IconNum = getIcon(campaign.icon);
              const percentage = campaign.goal_amount > 0 
                ? Math.round((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100)
                : 0;
              
              return (
                <Card 
                  key={campaign.id} 
                  className="p-5 animate-scale-in border-border/50 bg-card/40 backdrop-blur-md hover:shadow-card transition-all"
                  style={{ animationDelay: `${(index + 2) * 50}ms` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 shadow-soft">
                      <IconNum className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{campaign.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{campaign.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
                      <span className="text-muted-foreground">
                        {Number(campaign.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">{percentage}%</span>
                      <span className="text-muted-foreground">
                        Meta: {Number(campaign.goal_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5"
                    onClick={() => handleContribute(campaign)}
                  >
                    Contribuir para esta causa
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </div>
      
      {/* Contribute Modal */}
      <ContributeModal 
        campaign={selectedCampaign}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Offerings;
