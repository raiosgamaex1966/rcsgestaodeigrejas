import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectModal = ({ open, onOpenChange }: ConnectModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address_city: "",
    how_found: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        address_city: formData.address_city.trim() || null,
        member_type: "visitante",
        notes: formData.how_found ? `Como conheceu: ${formData.how_found}` : null,
      });

      if (error) throw error;

      toast.success("Bem-vindo! Ficamos felizes em conhecer você!", {
        description: "Em breve entraremos em contato.",
      });
      
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address_city: "",
        how_found: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao salvar dados", {
        description: "Por favor, tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-serif">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            Quero me Conectar
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
            <Label htmlFor="city">Cidade onde mora</Label>
            <Input
              id="city"
              placeholder="Sua cidade"
              value={formData.address_city}
              onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="how_found">Como conheceu a igreja?</Label>
            <Select
              value={formData.how_found}
              onValueChange={(value) => setFormData({ ...formData, how_found: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amigo">Convite de amigo/familiar</SelectItem>
                <SelectItem value="redes_sociais">Redes sociais</SelectItem>
                <SelectItem value="google">Busca no Google</SelectItem>
                <SelectItem value="passou_frente">Passei em frente</SelectItem>
                <SelectItem value="evento">Evento especial</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Conectar-se"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
