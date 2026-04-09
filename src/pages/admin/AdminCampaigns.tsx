import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllCampaigns } from "@/hooks/useCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Target, QrCode, Building2 } from "lucide-react";

const AdminCampaigns = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_amount: "",
    current_amount: "",
    icon: "Heart",
    is_active: true,
    // Payment info
    use_global_pix: true,
    pix_key: "",
    pix_key_type: "CNPJ",
    pix_beneficiary_name: "",
    pix_qrcode_url: "",
    bank_name: "",
    bank_agency: "",
    bank_account: "",
    bank_holder_name: "",
  });

  const { data: campaigns = [], isLoading } = useAllCampaigns();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      goal_amount: "",
      current_amount: "",
      icon: "Heart",
      is_active: true,
      use_global_pix: true,
      pix_key: "",
      pix_key_type: "CNPJ",
      pix_beneficiary_name: "",
      pix_qrcode_url: "",
      bank_name: "",
      bank_agency: "",
      bank_account: "",
      bank_holder_name: "",
    });
    setEditingId(null);
  };

  const handleEdit = (campaign: any) => {
    setFormData({
      title: campaign.title,
      description: campaign.description || "",
      goal_amount: campaign.goal_amount?.toString() || "",
      current_amount: campaign.current_amount?.toString() || "0",
      icon: campaign.icon || "Heart",
      is_active: campaign.is_active,
      use_global_pix: campaign.use_global_pix ?? true,
      pix_key: campaign.pix_key || "",
      pix_key_type: campaign.pix_key_type || "CNPJ",
      pix_beneficiary_name: campaign.pix_beneficiary_name || "",
      pix_qrcode_url: campaign.pix_qrcode_url || "",
      bank_name: campaign.bank_name || "",
      bank_agency: campaign.bank_agency || "",
      bank_account: campaign.bank_account || "",
      bank_holder_name: campaign.bank_holder_name || "",
    });
    setEditingId(campaign.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    const data = {
      title: formData.title,
      description: formData.description || null,
      goal_amount: parseFloat(formData.goal_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      icon: formData.icon,
      is_active: formData.is_active,
      use_global_pix: formData.use_global_pix,
      pix_key: formData.pix_key || null,
      pix_key_type: formData.pix_key_type || null,
      pix_beneficiary_name: formData.pix_beneficiary_name || null,
      pix_qrcode_url: formData.pix_qrcode_url || null,
      bank_name: formData.bank_name || null,
      bank_agency: formData.bank_agency || null,
      bank_account: formData.bank_account || null,
      bank_holder_name: formData.bank_holder_name || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("campaigns").update(data).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Campanha atualizada!" });
      } else {
        const { error } = await supabase.from("campaigns").insert(data);
        if (error) throw error;
        toast({ title: "Campanha criada!" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta campanha?")) return;
    
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Campanha excluída!" });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie as campanhas de arrecadação</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Campanha" : "Nova Campanha"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="payment">Pagamento</TabsTrigger>
                </TabsList>
                
                {/* Tab: Info */}
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nome da campanha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição da campanha..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Meta (R$) *</Label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        value={formData.goal_amount}
                        onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                        placeholder="50000.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Arrecadado (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.current_amount}
                        onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Heart, Target, Building2..."
                    />
                    <p className="text-xs text-muted-foreground">Nome do ícone Lucide (ex: Heart, Target, Building2)</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Campanha ativa</span>
                  </label>
                </TabsContent>
                
                {/* Tab: Payment */}
                <TabsContent value="payment" className="space-y-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-secondary rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.use_global_pix}
                      onChange={(e) => setFormData({ ...formData, use_global_pix: e.target.checked })}
                      className="rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">Usar configurações globais da igreja</span>
                      <p className="text-xs text-muted-foreground">Se ativado, usará o PIX configurado nas configurações da igreja</p>
                    </div>
                  </label>
                  
                  {!formData.use_global_pix && (
                    <div className="space-y-6 animate-fade-in">
                      {/* PIX Info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-accent" />
                          Informações PIX
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Tipo de Chave</Label>
                            <Select 
                              value={formData.pix_key_type} 
                              onValueChange={(value) => setFormData({ ...formData, pix_key_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CPF">CPF</SelectItem>
                                <SelectItem value="CNPJ">CNPJ</SelectItem>
                                <SelectItem value="Email">E-mail</SelectItem>
                                <SelectItem value="Telefone">Telefone</SelectItem>
                                <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Chave PIX</Label>
                            <Input
                              value={formData.pix_key}
                              onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                              placeholder="Digite a chave PIX"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Nome do Favorecido</Label>
                          <Input
                            value={formData.pix_beneficiary_name}
                            onChange={(e) => setFormData({ ...formData, pix_beneficiary_name: e.target.value })}
                            placeholder="Nome que aparecerá no PIX"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>URL do QR Code</Label>
                          <Input
                            value={formData.pix_qrcode_url}
                            onChange={(e) => setFormData({ ...formData, pix_qrcode_url: e.target.value })}
                            placeholder="https://..."
                          />
                          <p className="text-xs text-muted-foreground">Link da imagem do QR Code PIX</p>
                        </div>
                      </div>
                      
                      {/* Bank Info */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent" />
                          Dados Bancários (opcional)
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Banco</Label>
                            <Input
                              value={formData.bank_name}
                              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                              placeholder="Ex: Bradesco"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Agência</Label>
                            <Input
                              value={formData.bank_agency}
                              onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                              placeholder="Ex: 1234"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Conta</Label>
                            <Input
                              value={formData.bank_account}
                              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                              placeholder="Ex: 12345-6"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Titular da Conta</Label>
                            <Input
                              value={formData.bank_holder_name}
                              onChange={(e) => setFormData({ ...formData, bank_holder_name: e.target.value })}
                              placeholder="Nome do titular"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma campanha cadastrada</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const percentage = campaign.goal_amount > 0 
              ? Math.round((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100)
              : 0;
            
            return (
              <Card key={campaign.id} variant="elevated" className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Target className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                        {!campaign.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">Inativa</span>
                        )}
                        {!campaign.use_global_pix && (
                          <span className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">PIX próprio</span>
                        )}
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                      )}
                      
                      <div className="space-y-1">
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-gold rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{Number(campaign.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          <span className="font-medium text-accent">{percentage}%</span>
                          <span>{Number(campaign.goal_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;
