import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Cross, PartyPopper } from "lucide-react";
import { format } from "date-fns";

interface ConversionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConversionModal = ({ open, onOpenChange }: ConversionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [wantsBaptism, setWantsBaptism] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    conversion_date: format(new Date(), "yyyy-MM-dd"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Create profile
      const profileId = crypto.randomUUID();
      const { error: profileError } = await supabase.from("profiles").insert({
        id: profileId,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        member_type: "novo_convertido",
        conversion_date: formData.conversion_date,
      });

      if (profileError) throw profileError;

      // If wants baptism, create request
      if (wantsBaptism) {
        await supabase.from("requests").insert({
          name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          type: "baptism",
          message: "Desejo ser batizado(a). Acabei de tomar minha decisão por Jesus!",
          status: "pending",
        });
      }

      setSuccess(true);
      
      // Reset after celebration
      setTimeout(() => {
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          conversion_date: format(new Date(), "yyyy-MM-dd"),
        });
        setWantsBaptism(false);
        setSuccess(false);
        onOpenChange(false);
      }, 4000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao salvar dados", {
        description: "Por favor, tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                Glória a Deus! 🎉
              </h2>
              <p className="text-muted-foreground">
                Que alegria celebrar sua decisão de caminhar com Jesus!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Os céus se alegram junto conosco!
              </p>
            </div>
            <div className="text-4xl animate-pulse">
              ✝️ 🙏 💖
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-serif">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Cross className="w-5 h-5 text-yellow-600" />
            </div>
            Decidi Caminhar com Jesus
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-center text-yellow-800 dark:text-yellow-200">
              "Portanto, se alguém está em Cristo, é nova criação. As coisas antigas já passaram; eis que surgiram coisas novas!" 
              <span className="block mt-1 font-medium">2 Coríntios 5:17</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              placeholder="Seu nome completo"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion_date">Data da decisão</Label>
            <Input
              id="conversion_date"
              type="date"
              value={formData.conversion_date}
              onChange={(e) => setFormData({ ...formData, conversion_date: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg">
            <Checkbox
              id="baptism"
              checked={wantsBaptism}
              onCheckedChange={(checked) => setWantsBaptism(checked as boolean)}
            />
            <Label htmlFor="baptism" className="text-sm cursor-pointer">
              Desejo ser batizado(a) nas águas
            </Label>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Iniciar minha caminhada"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
