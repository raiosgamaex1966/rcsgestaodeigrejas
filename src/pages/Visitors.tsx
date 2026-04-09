import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, HandHeart, Cross, HelpCircle, ArrowLeft } from "lucide-react";
import { VisitorCard } from "@/components/visitors/VisitorCard";
import { ConnectModal } from "@/components/visitors/ConnectModal";
import { ConversionModal } from "@/components/visitors/ConversionModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Visitors = () => {
  const navigate = useNavigate();
  const { getTenantPath } = useAuth();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);

  const handlePrayerRequest = () => {
    navigate(getTenantPath("/requests"), { state: { defaultType: "prayer" } });
  };

  const handleHelpRequest = () => {
    navigate(getTenantPath("/requests"), { state: { defaultType: "pastoral" } });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="relative overflow-hidden px-4 py-8">
        {/* Decorative background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="text-center px-6 pb-12 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-soft transform -rotate-3">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
            Seja bem-vindo à nossa família!
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Estamos radiantes com sua presença. Como podemos caminhar com você hoje?
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Quero me Conectar */}
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <VisitorCard
              icon={Heart}
              iconBgColor="bg-primary/10"
              iconColor="text-primary"
              title="Quero me conectar"
              description="Adoraríamos conhecê-lo melhor"
              buttonText="Conectar"
              buttonVariant="primary"
              onClick={() => setConnectModalOpen(true)}
            />
          </div>

          {/* Podemos orar por você? */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <VisitorCard
              icon={HandHeart}
              iconBgColor="bg-secondary/20"
              iconColor="text-secondary"
              title="Podemos orar?"
              description="Clama a mim e te responderei"
              buttonText="Pedir Oração"
              buttonVariant="accent"
              onClick={handlePrayerRequest}
            />
          </div>

          {/* Precisa de ajuda? */}
          <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
            <VisitorCard
              icon={HelpCircle}
              iconBgColor="bg-burgundy/10"
              iconColor="text-burgundy"
              title="Precisa de ajuda?"
              description="Apoio espiritual e pastoral"
              buttonText="Apoio"
              buttonVariant="burgundy"
              onClick={handleHelpRequest}
            />
          </div>

          {/* Decidi caminhar com Jesus */}
          <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
            <VisitorCard
              icon={Cross}
              iconBgColor="bg-gold/10"
              iconColor="text-gold"
              title="Caminhar com Jesus"
              description="Mudar minha vida hoje!"
              buttonText="Iniciar"
              buttonVariant="gold"
              onClick={() => setConversionModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConnectModal open={connectModalOpen} onOpenChange={setConnectModalOpen} />
      <ConversionModal open={conversionModalOpen} onOpenChange={setConversionModalOpen} />
    </div>
  );
};

export default Visitors;
