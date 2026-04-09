import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Fingerprint, Lock, FileKey, Activity, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const SuperAdminSecurity = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enforce2FA: false,
    complexPasswords: true,
    sessionTimeout: true,
    lgpdConsent: true,
    dataRetentionDays: 365,
  });

  const handleSave = () => {
    setLoading(true);
    // Em um cenário real, salvaria no banco (tabela global_settings)
    setTimeout(() => {
      toast({
        title: "Configurações salvas",
        description: "As políticas de segurança e LGPD foram atualizadas com sucesso.",
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Segurança e Privacidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie políticas de autenticação e conformidade com a LGPD em todas as congregações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication & Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              Autenticação e Acesso
            </CardTitle>
            <CardDescription>
              Regras globais de login para pastores e membros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Forçar 2FA (Múltiplos Fatores)</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir autenticação em duas etapas para Administradores de Igreja.
                </p>
              </div>
              <Switch
                checked={settings.enforce2FA}
                onCheckedChange={(v) => setSettings({ ...settings, enforce2FA: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Senhas Complexas</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir letras maiúsculas, números e símbolos em novas senhas.
                </p>
              </div>
              <Switch
                checked={settings.complexPasswords}
                onCheckedChange={(v) => setSettings({ ...settings, complexPasswords: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Timeout Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Desconectar usuários inativos após 60 minutos de ociosidade.
                </p>
              </div>
              <Switch
                checked={settings.sessionTimeout}
                onCheckedChange={(v) => setSettings({ ...settings, sessionTimeout: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* LGPD Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileKey className="w-5 h-5 text-emerald-500" />
              Conformidade LGPD
            </CardTitle>
            <CardDescription>
              Tratamento de dados e direitos do titular.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Consentimento Explícito</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir aceite dos Termos de Uso e Política de Privacidade no cadastro.
                </p>
              </div>
              <Switch
                checked={settings.lgpdConsent}
                onCheckedChange={(v) => setSettings({ ...settings, lgpdConsent: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Direito ao Esquecimento</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que membros excluam sua própria conta e ofusquem dados.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="border-t pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Retenção de Dados Excluídos</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Os dados de igrejas canceladas serão mantidos por {settings.dataRetentionDays} dias antes da deleção permanente física por questões judiciais ou fiscais.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Quick Glace */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Fingerprint className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Central de Auditoria</h3>
                <p className="text-sm text-muted-foreground">
                  Para controle de acesso e LGPD, todos os eventos do sistema são registrados.
                </p>
              </div>
            </div>
            <Link to="/superadmin/audit">
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                Ver Logs de Auditoria
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Salvando..." : "Salvar Políticas de Segurança"}
        </Button>
      </div>
    </div>
  );
};

export default SuperAdminSecurity;
