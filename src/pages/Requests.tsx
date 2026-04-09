import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  HandHeart,
  Droplets,
  Package,
  MapPin,
  Users,
  Send,
  ArrowLeft,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreateRequest, RequestType } from "@/hooks/useRequests";

const requestTypes = [
  {
    id: "prayer" as RequestType,
    title: "Oração",
    description: "Envie seu pedido de oração",
    icon: HandHeart,
    color: "bg-burgundy/10 text-burgundy",
  },
  {
    id: "baptism" as RequestType,
    title: "Batismo",
    description: "Inscreva-se para o próximo batismo",
    icon: Droplets,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "food_basket" as RequestType,
    title: "Cesta Básica",
    description: "Solicite auxílio alimentar",
    icon: Package,
    color: "bg-accent/10 text-accent",
  },
  {
    id: "visitation" as RequestType,
    title: "Visita",
    description: "Solicite uma visita pastoral",
    icon: MapPin,
    color: "bg-indigo-light/10 text-indigo-light",
  },
  {
    id: "pastoral" as RequestType,
    title: "Direção Pastoral",
    description: "Agende uma conversa com um pastor",
    icon: Users,
    color: "bg-gold/10 text-gold",
  },
];

const Requests = () => {
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    urgent: false,
  });

  const { toast } = useToast();
  const createRequest = useCreateRequest();
  const selectedRequest = requestTypes.find(r => r.id === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) return;

    try {
      await createRequest.mutateAsync({
        type: selectedType,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        message: formData.message.trim(),
        is_urgent: formData.urgent,
      });

      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada!",
        description: "Entraremos em contato em breve.",
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setIsSubmitted(false);
    setFormData({ name: "", phone: "", email: "", message: "", urgent: false });
  };

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="text-center animate-scale-in bg-card/40 backdrop-blur-md p-8 rounded-3xl border border-border/50 shadow-soft">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">
            Solicitação Enviada!
          </h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Recebemos sua solicitação de {selectedRequest?.title.toLowerCase()}.
            Nossa equipe pastoral entrará em contato em breve.
          </p>
          <Button onClick={handleBack} className="rounded-xl px-8 h-12 text-xs font-bold uppercase tracking-widest shadow-soft">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg md:max-w-4xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4">
          {selectedType ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground">
                  {selectedRequest?.title}
                </h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  Formulário de Pedido
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">
                Central de Solicitações
              </h1>
              <p className="text-sm text-muted-foreground">
                Como nossa comunidade pode caminhar com você?
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {!selectedType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestTypes.map((type, index) => {
              const IconNum = type.icon;
              return (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:shadow-card transition-all duration-300 animate-slide-up border-border/50 bg-card/40 backdrop-blur-md group"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-5">
                      <div className={cn("p-4 rounded-2xl shadow-soft group-hover:scale-110 transition-transform duration-300", type.color)}>
                        <IconNum className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {type.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up max-w-md mx-auto mt-4">
            <Card className="p-6 border-border/50 bg-card/40 backdrop-blur-md shadow-soft space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome completo *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                  className="bg-secondary/50 border-0 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Telefone *</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-secondary/50 border-0 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="bg-secondary/50 border-0 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {selectedType === "prayer" ? "Seu pedido de oração *" : "Mensagem *"}
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    selectedType === "prayer"
                      ? "Compartilhe seu pedido de oração..."
                      : "Descreva sua solicitação..."
                  }
                  className="bg-secondary/50 border-0 rounded-2xl resize-none"
                />
              </div>

              {selectedType === "prayer" && (
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={formData.urgent}
                    onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="urgent" className="text-xs font-bold uppercase tracking-widest cursor-pointer text-burgundy">
                    Este é um pedido urgente
                  </Label>
                </div>
              )}
            </Card>

            <Button
              type="submit"
              variant="gold"
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-soft"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Requests;
