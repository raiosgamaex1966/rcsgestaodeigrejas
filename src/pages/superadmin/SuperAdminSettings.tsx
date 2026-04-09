import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Save, Mail, Globe, ShieldCheck, Bell, CreditCard, Palette,
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  platform_name: string;
  platform_description: string;
  owner_name: string;
  owner_email: string;
  support_email: string;
  support_phone: string;
  website_url: string;
  default_password: string;
  enable_email_notifications: boolean;
  enable_auto_block: boolean;
  auto_block_days_overdue: number;
  enable_self_registration: boolean;
  require_approval: boolean;
  primary_color: string;
  logo_url: string;
}

const defaultSettings: SystemSettings = {
  platform_name: "RCS Gestão de Igrejas",
  platform_description: "Sistema completo de gestão para igrejas e ministérios",
  owner_name: "Robson Cordeiro",
  owner_email: "robsoncordeiro1966@gmail.com",
  support_email: "suporte@rcsgestao.com",
  support_phone: "(11) 99999-9999",
  website_url: "https://rcsgestao.com",
  default_password: "Membro2026!",
  enable_email_notifications: true,
  enable_auto_block: true,
  auto_block_days_overdue: 15,
  enable_self_registration: true,
  require_approval: true,
  primary_color: "#2563eb",
  logo_url: "/logo.png",
};

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rcs_system_settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("rcs_system_settings", JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações salvas com sucesso!");
    }, 500);
  };

  const update = (key: keyof SystemSettings, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Configurações</h1>
          <p className="text-muted-foreground">
            Configurações gerais do sistema RCS Gestão
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            Plataforma
          </CardTitle>
          <CardDescription>Informações gerais do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Plataforma</Label>
              <Input
                value={settings.platform_name}
                onChange={(e) => update("platform_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={settings.website_url}
                onChange={(e) => update("website_url", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={settings.platform_description}
                onChange={(e) => update("platform_description", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner / Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5" />
            Proprietário & Contato
          </CardTitle>
          <CardDescription>
            Dados do proprietário e canais de suporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Proprietário</Label>
              <Input
                value={settings.owner_name}
                onChange={(e) => update("owner_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email do Proprietário</Label>
              <Input
                type="email"
                value={settings.owner_email}
                onChange={(e) => update("owner_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email de Suporte</Label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => update("support_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone de Suporte</Label>
              <Input
                value={settings.support_phone}
                onChange={(e) => update("support_phone", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Segurança & Acesso
          </CardTitle>
          <CardDescription>
            Regras de cadastro, bloqueio e senhas padrão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Senha Padrão para Novos Membros</Label>
              <Input
                value={settings.default_password}
                onChange={(e) => update("default_password", e.target.value)}
                placeholder="Membro2026!"
              />
              <p className="text-xs text-muted-foreground">
                Usada ao criar membros pelo painel admin
              </p>
            </div>
            <div className="space-y-2">
              <Label>Dias para Bloqueio Automático</Label>
              <Input
                type="number"
                value={settings.auto_block_days_overdue}
                onChange={(e) =>
                  update("auto_block_days_overdue", Number(e.target.value))
                }
              />
              <p className="text-xs text-muted-foreground">
                Dias após vencimento para bloquear automaticamente
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto-cadastro de Igrejas</p>
                <p className="text-xs text-muted-foreground">
                  Permitir que igrejas se cadastrem diretamente
                </p>
              </div>
              <Switch
                checked={settings.enable_self_registration}
                onCheckedChange={(v) => update("enable_self_registration", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Aprovação de Membros</p>
                <p className="text-xs text-muted-foreground">
                  Exigir aprovação do pastor para novos membros
                </p>
              </div>
              <Switch
                checked={settings.require_approval}
                onCheckedChange={(v) => update("require_approval", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Bloqueio Automático</p>
                <p className="text-xs text-muted-foreground">
                  Bloquear igrejas inadimplentes automaticamente
                </p>
              </div>
              <Switch
                checked={settings.enable_auto_block}
                onCheckedChange={(v) => update("enable_auto_block", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configurações de emails automáticos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Notificações por Email</p>
                <p className="text-xs text-muted-foreground">
                  Enviar emails de vencimento, novos cadastros e alertas
                </p>
              </div>
              <Switch
                checked={settings.enable_email_notifications}
                onCheckedChange={(v) =>
                  update("enable_email_notifications", v)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalização visual da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL do Logo</Label>
              <Input
                value={settings.logo_url}
                onChange={(e) => update("logo_url", e.target.value)}
                placeholder="/logo.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSettings;
