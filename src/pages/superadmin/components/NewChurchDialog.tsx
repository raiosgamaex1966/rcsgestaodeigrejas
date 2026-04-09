import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface NewChurchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NewChurchDialog = ({ open, onOpenChange, onSuccess }: NewChurchDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tax_id: "",
    admin_email: "",
    provisional_password: "",
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic slugification: lowercase, replace spaces/special chars with hyphens
    const val = e.target.value;
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.admin_email || !formData.provisional_password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome, slug, e-mail e senha provisória da igreja.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Check if slug exists
      const { data: existingSlug } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", formData.slug)
        .maybeSingle();

      if (existingSlug) {
        toast({
          title: "URL indispovível",
          description: "Já existe uma igreja usando esta URL.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 2. Insert tenant
      // Note: For actual SaaS, we usually bind the current owner to it, or leave it orphaned until a pastor joins.
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 4); // default 4 day trial

      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: formData.name,
          slug: formData.slug,
          tax_id: formData.tax_id || null,
          subscription_status: "trial",
          trial_ends_at: trialEnds.toISOString(),
          is_active: true,
          settings: { 
            monthly_value: 0, 
            adhesion_value: 0, 
            contract_months: 12,
            admin_email: formData.admin_email,
            provisional_password: formData.provisional_password
          }
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Log the creation in audit
      await supabase.from("audit_logs").insert({
        action: "create",
        entity_type: "tenant",
        entity_id: data.id,
        user_id: user?.id,
        tenant_id: data.id,
        details: { name: formData.name, slug: formData.slug }
      });

      toast({
        title: "Igreja cadastrada!",
        description: "Agora você pode enviar um convite para o administrador.",
      });

      setFormData({ name: "", slug: "", tax_id: "", admin_email: "", provisional_password: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar igreja. Verifique as permissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Igreja</DialogTitle>
          <DialogDescription>
            Crie o ambiente da igreja. Depois, você poderá enviar um convite para o pastor responsável acessar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-left font-medium">
              Nome da Igreja <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Igreja Batista Central"
              value={formData.name}
              onChange={handleNameChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug" className="text-left font-medium">
              URL da Igreja (Slug) <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">
                app.rcs.com/
              </span>
              <Input
                id="slug"
                className="rounded-l-none"
                placeholder="igreja-batista"
                value={formData.slug}
                onChange={handleSlugChange}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Apenas letras minúsculas, números e hifens.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tax_id" className="text-left font-medium">
              CNPJ ou CPF (Opcional)
            </Label>
            <Input
              id="tax_id"
              placeholder="00.000.000/0001-00"
              value={formData.tax_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, tax_id: e.target.value }))}
            />
          </div>

          <div className="grid gap-2 text-primary bg-primary/5 p-3 rounded-lg border border-primary/10">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Dados de Acesso (Pastor)</h4>
            
            <div className="space-y-2">
              <Label htmlFor="admin_email" className="text-left font-medium">
                E-mail de Acesso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="pastor@igreja.com"
                value={formData.admin_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, admin_email: e.target.value }))}
              />
            </div>

            <div className="space-y-2 mt-2">
              <Label htmlFor="provisional_password" className="text-left font-medium">
                Senha Provisória <span className="text-red-500">*</span>
              </Label>
              <Input
                id="provisional_password"
                placeholder="Ex: Igreja@2026"
                value={formData.provisional_password}
                onChange={(e) => setFormData((prev) => ({ ...prev, provisional_password: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Criar Ambiente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
