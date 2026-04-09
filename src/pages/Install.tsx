import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { settings, isLoading: themeLoading } = useTheme();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-12 space-y-8">
        {/* Immersive Brand Header */}
        <div className="text-center space-y-4 animate-scale-in">
          {!themeLoading && (
            settings?.logo_url ? (
              <div className="relative inline-block group">
                 <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <img 
                   src={settings.logo_url} 
                   alt={settings?.church_name || 'Logo'} 
                   className="w-24 h-24 mx-auto object-contain relative z-10 transition-transform group-hover:scale-110 duration-500"
                 />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto bg-primary rounded-[32px] flex items-center justify-center shadow-2xl-soft rotate-3 hover:rotate-0 transition-all duration-500">
                <Smartphone className="w-12 h-12 text-primary-foreground" />
              </div>
            )
          )}
          <div className="space-y-2">
             <h1 className="text-3xl font-serif font-black text-foreground tracking-tight">
               Instalar {settings?.church_name || 'Aplicativo'}
             </h1>
             <p className="text-sm text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
               Acesse nossa comunidade com um clique direto da sua tela inicial.
             </p>
          </div>
        </div>

        {/* Installation Strategy Hub */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          {isInstalled ? (
            <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-md rounded-[32px] overflow-hidden p-8 text-center space-y-4 border-2 border-dashed">
              <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-serif font-bold text-green-700">Tudo pronto!</p>
                <p className="text-sm text-green-600/80 font-medium">
                  O {settings?.church_name || 'app'} já faz parte do seu dispositivo.
                </p>
              </div>
            </Card>
          ) : isIOS ? (
            <Card className="border-border/40 shadow-soft bg-card/60 backdrop-blur-xl rounded-[40px] overflow-hidden p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center text-foreground">
                  <Share className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Guia iOS</h3>
                  <p className="font-serif font-bold text-lg">Instalação Manual</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 1, text: <>Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.</>, icon: <Share className="w-4 h-4 inline text-primary ml-1" /> },
                  { step: 2, text: <>Role as opções e selecione <strong>"Adicionar à Tela de Início"</strong>.</> },
                  { step: 3, text: <>Confirme tocando em <strong>"Adicionar"</strong> no canto superior.</> }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black transition-transform group-hover:scale-110">
                      {item.step}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : deferredPrompt ? (
            <Card className="border-border/40 shadow-2xl-soft bg-card/80 backdrop-blur-xl rounded-[40px] overflow-hidden p-8 space-y-6 text-center">
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Recomendado</p>
                 <h2 className="text-xl font-serif font-bold">Experiência Completa</h2>
               </div>
               
               <Button
                onClick={handleInstall}
                className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-soft shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                <Download className="w-6 h-6 mr-3" />
                Instalar Agora
              </Button>
              
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                Seguro • Leve • Funciona Offline
              </p>
            </Card>
          ) : (
            <Card className="border-border/40 shadow-soft bg-card/60 backdrop-blur-xl rounded-[32px] p-8 text-center border-2 border-dashed">
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Abra este link diretamente no navegador do seu smartphone para habilitar a instalação.
              </p>
            </Card>
          )}
        </div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-center text-muted-foreground/40 pb-2">Por que instalar?</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Offline", desc: "Acesse devocionais sem internet", icon: Check },
              { title: "Rápido", desc: "Um clique para entrar", icon: Check },
              { title: "Leve", desc: "Não consome memória", icon: Check },
              { title: "Moderno", desc: "Atualizações automáticas", icon: Check }
            ].map((benefit, idx) => (
              <Card key={idx} className="p-5 border-border/30 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-soft transition-all">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
                   <benefit.icon className="w-4 h-4 stroke-[3]" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">{benefit.title}</p>
                <p className="text-[10px] leading-tight text-muted-foreground/80 font-medium">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Install;
