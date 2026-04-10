import { useState, useRef } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Upload, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminPWA = () => {
  const { settings, isLoading, updateSettings, uploadAsset } = useChurchSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const icon192Ref = useRef<HTMLInputElement>(null);
  const icon512Ref = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.keys(formData).length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    updateSettings.mutate(formData);
    setFormData({});
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadAsset(file, 'pwa-icons');
    if (url) {
      setFormData(prev => ({ ...prev, [field]: url }));
      toast.success('Ícone enviado com sucesso!');
    }
    setUploading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  const getValue = (field: string): string => {
    const settingsValue = settings?.[field as keyof typeof settings];
    return formData[field] ?? (typeof settingsValue === 'string' ? settingsValue : '') ?? '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações PWA</h1>
          <p className="text-muted-foreground">Configure o aplicativo instalável</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending || Object.keys(formData).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As configurações PWA afetam como o app aparece quando instalado no celular. 
          Algumas mudanças podem exigir que o usuário reinstale o app.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do App */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Informações do App
            </CardTitle>
            <CardDescription>Nome e descrição do aplicativo instalável</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwa_name">Nome Completo</Label>
              <Input
                id="pwa_name"
                value={getValue('pwa_name')}
                onChange={(e) => handleChange('pwa_name', e.target.value)}
                placeholder="Igreja RCS Gestão"
              />
              <p className="text-xs text-muted-foreground">
                Nome exibido na tela de instalação
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwa_short_name">Nome Curto</Label>
              <Input
                id="pwa_short_name"
                value={getValue('pwa_short_name')}
                onChange={(e) => handleChange('pwa_short_name', e.target.value)}
                placeholder="RCS Gestão"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Nome exibido abaixo do ícone (máx. 12 caracteres)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwa_description">Descrição</Label>
              <Textarea
                id="pwa_description"
                value={getValue('pwa_description')}
                onChange={(e) => handleChange('pwa_description', e.target.value)}
                placeholder="Aplicativo oficial da igreja..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwa_theme_color">Cor do Tema</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={getValue('pwa_theme_color') || '#4338ca'}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  id="pwa_theme_color"
                  value={getValue('pwa_theme_color')}
                  onChange={(e) => handleChange('pwa_theme_color', e.target.value)}
                  placeholder="#4338ca"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cor da barra de status do navegador
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwa_background_color">Cor de Fundo</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={getValue('pwa_background_color') || '#faf8f5'}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  id="pwa_background_color"
                  value={getValue('pwa_background_color')}
                  onChange={(e) => handleChange('pwa_background_color', e.target.value)}
                  placeholder="#faf8f5"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cor de fundo da splash screen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ícones */}
        <Card>
          <CardHeader>
            <CardTitle>Ícones do App</CardTitle>
            <CardDescription>Ícones exibidos na tela inicial do dispositivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Ícone 192x192px</Label>
              <p className="text-xs text-muted-foreground">
                Usado em dispositivos Android e como ícone padrão
              </p>
              <div className="flex items-center gap-4">
                {getValue('pwa_icon_192_url') ? (
                  <img
                    src={getValue('pwa_icon_192_url')}
                    alt="Icon 192"
                    className="w-12 h-12 rounded-lg border bg-background"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">192</span>
                  </div>
                )}
                <div>
                  <input
                    ref={icon192Ref}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'pwa_icon_192_url')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => icon192Ref.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícone 512x512px</Label>
              <p className="text-xs text-muted-foreground">
                Usado na splash screen e dispositivos de alta resolução
              </p>
              <div className="flex items-center gap-4">
                {getValue('pwa_icon_512_url') ? (
                  <img
                    src={getValue('pwa_icon_512_url')}
                    alt="Icon 512"
                    className="w-16 h-16 rounded-lg border bg-background"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">512</span>
                  </div>
                )}
                <div>
                  <input
                    ref={icon512Ref}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'pwa_icon_512_url')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => icon512Ref.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <Label className="mb-3 block">Preview da Instalação</Label>
              <div className="flex flex-col items-center p-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl">
                <div 
                  className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getValue('pwa_theme_color') || '#4338ca' }}
                >
                  {getValue('pwa_icon_192_url') ? (
                    <img 
                      src={getValue('pwa_icon_192_url')} 
                      alt="App Icon" 
                      className="w-full h-full rounded-2xl"
                    />
                  ) : (
                    <span className="text-2xl">
                      {(getValue('pwa_short_name') || 'V').charAt(0)}
                    </span>
                  )}
                </div>
                <span className="mt-2 text-white text-xs font-medium">
                  {getValue('pwa_short_name') || 'RCS Gestão'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPWA;
