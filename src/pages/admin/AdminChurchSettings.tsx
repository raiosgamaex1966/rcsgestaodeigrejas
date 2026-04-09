import { useState, useRef } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Church, Image, Save } from "lucide-react";
import { toast } from "sonner";

const AdminChurchSettings = () => {
  const { settings, isLoading, updateSettings, uploadAsset } = useChurchSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
    field: string,
    path: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadAsset(file, path);
    if (url) {
      setFormData(prev => ({ ...prev, [field]: url }));
      toast.success('Arquivo enviado com sucesso!');
    }
    setUploading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
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
          <h1 className="text-2xl font-bold text-foreground">Configurações da Igreja</h1>
          <p className="text-muted-foreground">Gerencie as informações básicas e identidade visual</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending || Object.keys(formData).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Nome e descrição da igreja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="church_name">Nome da Igreja</Label>
              <Input
                id="church_name"
                value={getValue('church_name')}
                onChange={(e) => handleChange('church_name', e.target.value)}
                placeholder="Igreja VERBO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan</Label>
              <Input
                id="tagline"
                value={getValue('tagline')}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="Conectando você a Deus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={getValue('description')}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Breve descrição da igreja..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo e Favicon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Logo e Favicon
            </CardTitle>
            <CardDescription>Identidade visual do aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo Principal</Label>
              <div className="flex items-center gap-4">
                {getValue('logo_url') && (
                  <img
                    src={getValue('logo_url')}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded-lg border bg-background"
                  />
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'logo_url', 'logos')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload Logo'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                {getValue('favicon_url') && (
                  <img
                    src={getValue('favicon_url')}
                    alt="Favicon"
                    className="w-8 h-8 object-contain rounded border bg-background"
                  />
                )}
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'favicon_url', 'favicons')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload Favicon'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: 32x32px ou 64x64px</p>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato da igreja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail</Label>
              <Input
                id="contact_email"
                type="email"
                value={getValue('contact_email')}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contato@igreja.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone</Label>
              <Input
                id="contact_phone"
                value={getValue('contact_phone')}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address">Endereço</Label>
              <Textarea
                id="contact_address"
                value={getValue('contact_address')}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="Rua, número, bairro, cidade..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                value={getValue('website_url')}
                onChange={(e) => handleChange('website_url', e.target.value)}
                placeholder="https://www.igreja.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>Links para as redes sociais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="social_facebook">Facebook</Label>
              <Input
                id="social_facebook"
                value={getValue('social_facebook')}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/igreja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_instagram">Instagram</Label>
              <Input
                id="social_instagram"
                value={getValue('social_instagram')}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/igreja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_youtube">YouTube</Label>
              <Input
                id="social_youtube"
                value={getValue('social_youtube')}
                onChange={(e) => handleChange('social_youtube', e.target.value)}
                placeholder="https://youtube.com/@igreja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_whatsapp">WhatsApp</Label>
              <Input
                id="social_whatsapp"
                value={getValue('social_whatsapp')}
                onChange={(e) => handleChange('social_whatsapp', e.target.value)}
                placeholder="https://wa.me/5511999999999"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminChurchSettings;
