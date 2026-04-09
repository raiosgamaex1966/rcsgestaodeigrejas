import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Save, Plus, Edit, Trash2, Check, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_value: number;
  adhesion_value: number;
  contract_months: number;
  max_members: number;
  features: string[];
  is_active: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    description: "Ideal para igrejas pequenas",
    monthly_value: 49.90,
    adhesion_value: 0,
    contract_months: 12,
    max_members: 50,
    features: ["Gestão de membros", "Agenda de eventos", "Bíblia integrada"],
    is_active: true,
  },
  {
    id: "standard",
    name: "Padrão",
    description: "Para igrejas em crescimento",
    monthly_value: 99.90,
    adhesion_value: 99.90,
    contract_months: 12,
    max_members: 200,
    features: [
      "Tudo do Básico", "Financeiro completo", "Células", "Cursos",
      "Relatórios avançados",
    ],
    is_active: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Para igrejas maiores",
    monthly_value: 199.90,
    adhesion_value: 199.90,
    contract_months: 12,
    max_members: -1,
    features: [
      "Tudo do Padrão", "Membros ilimitados", "IA para sermões",
      "Suporte prioritário", "Personalização total",
    ],
    is_active: true,
  },
];

const SuperAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [globalSettings, setGlobalSettings] = useState({
    trial_days: 4,
    default_plan: "basic",
    allow_self_registration: true,
  });
  const [saving, setSaving] = useState(false);

  // Load from church_settings or localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rcs_plans_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.plans) setPlans(parsed.plans);
        if (parsed.globalSettings) setGlobalSettings(parsed.globalSettings);
      } catch {}
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(
      "rcs_plans_config",
      JSON.stringify({ plans, globalSettings })
    );
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações de planos salvas com sucesso!");
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Planos & Valores</h1>
          <p className="text-muted-foreground">
            Configure os planos oferecidos às igrejas
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações Globais</CardTitle>
          <CardDescription>Defina as regras comerciais padrão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dias de Teste Gratuito</Label>
              <Input
                type="number"
                value={globalSettings.trial_days}
                onChange={(e) =>
                  setGlobalSettings((p) => ({
                    ...p,
                    trial_days: Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Período que a igreja testa o sistema sem pagar
              </p>
            </div>
            <div className="space-y-2">
              <Label>Plano Padrão</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={globalSettings.default_plan}
                onChange={(e) =>
                  setGlobalSettings((p) => ({
                    ...p,
                    default_plan: e.target.value,
                  }))
                }
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Plano atribuído ao final do teste
              </p>
            </div>
            <div className="space-y-2">
              <Label>Auto-cadastro</Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  checked={globalSettings.allow_self_registration}
                  onCheckedChange={(v) =>
                    setGlobalSettings((p) => ({
                      ...p,
                      allow_self_registration: v,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {globalSettings.allow_self_registration
                    ? "Permitido"
                    : "Somente por convite"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden ${
                plan.id === "standard" ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.id === "standard" && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                  Mais Popular
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      R$ {plan.monthly_value.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  {plan.adhesion_value > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      + R$ {plan.adhesion_value.toFixed(2).replace(".", ",")} de adesão
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Inclui:</p>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contrato</span>
                    <span className="font-medium">{plan.contract_months} meses</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Máx. Membros</span>
                    <span className="font-medium">
                      {plan.max_members === -1 ? "Ilimitado" : plan.max_members}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={plan.is_active ? "secondary" : "default"}
                    size="sm"
                    onClick={() => {
                      setPlans((ps) =>
                        ps.map((p) =>
                          p.id === plan.id
                            ? { ...p, is_active: !p.is_active }
                            : p
                        )
                      );
                    }}
                  >
                    {plan.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Plano: {editingPlan?.name}
            </DialogTitle>
            <DialogDescription>Altere os valores e recursos deste plano</DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={editingPlan.description}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mensalidade (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.monthly_value}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        monthly_value: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Adesão (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.adhesion_value}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        adhesion_value: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração do Contrato (meses)</Label>
                  <Input
                    type="number"
                    value={editingPlan.contract_months}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        contract_months: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Membros (-1 = ilimitado)</Label>
                  <Input
                    type="number"
                    value={editingPlan.max_members}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        max_members: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Recursos Incluídos</Label>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...editingPlan.features];
                          newFeatures[idx] = e.target.value;
                          setEditingPlan({ ...editingPlan, features: newFeatures });
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          const newFeatures = editingPlan.features.filter((_, i) => i !== idx);
                          setEditingPlan({ ...editingPlan, features: newFeatures });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditingPlan({
                        ...editingPlan,
                        features: [...editingPlan.features, ""],
                      })
                    }
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar recurso
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (editingPlan) {
                  setPlans((ps) =>
                    ps.map((p) => (p.id === editingPlan.id ? editingPlan : p))
                  );
                  toast.success(`Plano "${editingPlan.name}" atualizado! Clique em "Salvar Tudo" para persistir.`);
                  setEditingPlan(null);
                }
              }}
            >
              Aplicar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPlans;
