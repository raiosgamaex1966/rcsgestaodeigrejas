import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bell, Megaphone, Trash2, Activity, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

const SuperAdminAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    is_active: true,
  });

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("system_alerts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Erro", description: "Preencha título e mensagem", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("system_alerts").insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        is_active: formData.is_active,
        created_by: user?.id
      });
      
      if (error) throw error;

      toast({ title: "Aviso enviado", description: "O aviso foi publicado com sucesso." });
      setFormData({ title: "", message: "", type: "info", is_active: true });
      fetchAlerts();

      // Log in audit
      await supabase.from("audit_logs").insert({
        action: "create",
        entity_type: "alert",
        user_id: user?.id,
        details: { title: formData.title }
      });
    } catch (e: any) {
      toast({ title: "Erro ao criar", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from("system_alerts").update({ is_active: !currentStatus }).eq("id", id);
      fetchAlerts();
      toast({ title: "Status atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;
    try {
      await supabase.from("system_alerts").delete().eq("id", id);
      fetchAlerts();
      toast({ title: "Aviso excluído" });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary" />
          Avisos e Comunicados
        </h1>
        <p className="text-muted-foreground mt-1">
          Envie mensagens globais que aparecerão no painel de todas as igrejas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Novo Comunicado
            </CardTitle>
            <CardDescription>Crie um alerta de sistema ou novidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Aviso</Label>
              <Input 
                placeholder="Ex: Atualização do Sistema" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea 
                placeholder="O que você deseja comunicar a todas as congregações?" 
                className="h-24"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label>Tipo de Mensagem</Label>
              <RadioGroup 
                value={formData.type} 
                onValueChange={(val) => setFormData({ ...formData, type: val })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="info" id="r1" />
                  <Label htmlFor="r1" className="flex items-center gap-1 cursor-pointer">
                    <Info className="w-4 h-4 text-blue-500"/> Info
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warning" id="r2" />
                  <Label htmlFor="r2" className="flex items-center gap-1 cursor-pointer">
                    <AlertTriangle className="w-4 h-4 text-amber-500"/> Aviso
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="success" id="r3" />
                  <Label htmlFor="r3" className="flex items-center gap-1 cursor-pointer">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500"/> Sucesso
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between pt-4 pb-2">
              <Label className="text-sm font-medium cursor-pointer" htmlFor="active-switch">
                Publicar Imediatamente
              </Label>
              <Switch 
                id="active-switch" 
                checked={formData.is_active}
                onCheckedChange={(val) => setFormData({ ...formData, is_active: val })}
              />
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Enviando..." : "Transmitir Comunicado"}
            </Button>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            Últimos Comunicados
          </h3>
          
          {loading ? (
            <div className="p-12 text-center text-muted-foreground bg-card border rounded-lg">
              Carregando avisos...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-dashed rounded-lg">
              Nenhum aviso enviado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <Card key={alert.id} className={!alert.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg truncate">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {format(new Date(alert.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={alert.is_active} 
                            onCheckedChange={() => toggleStatus(alert.id, alert.is_active)}
                            title="Ativar/Desativar visualização"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => deleteAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {alert.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAlerts;
