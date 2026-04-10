import { useState, useRef } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Upload, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminSEO = () => {
  const { settings, isLoading, updateSettings, uploadAsset } = useChurchSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const ogImageRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadAsset(file, 'seo');
    if (url) {
      setFormData(prev => ({ ...prev, seo_og_image_url: url }));
      toast.success('Imagem enviada com sucesso!');
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
          <h1 className="text-2xl font-bold text-foreground">SEO & Meta Tags</h1>
          <p className="text-muted-foreground">Configure como seu app aparece no Google e redes sociais</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending || Object.keys(formData).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configurações SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Configurações SEO
            </CardTitle>
            <CardDescription>Otimize seu app para mecanismos de busca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">Título SEO</Label>
              <Input
                id="seo_title"
                value={getValue('seo_title')}
                onChange={(e) => handleChange('seo_title', e.target.value)}
                placeholder="RCS Gestão de Igrejas - Aplicativo Oficial"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {(getValue('seo_title') as string).length}/60 caracteres (recomendado: até 60)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">Meta Descrição</Label>
              <Textarea
                id="seo_description"
                value={getValue('seo_description')}
                onChange={(e) => handleChange('seo_description', e.target.value)}
                placeholder="Acesse a Bíblia, ministrações, planos de leitura e muito mais..."
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {(getValue('seo_description') as string).length}/160 caracteres (recomendado: 120-160)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">Palavras-chave</Label>
              <Input
                id="seo_keywords"
                value={getValue('seo_keywords')}
                onChange={(e) => handleChange('seo_keywords', e.target.value)}
                placeholder="igreja, bíblia, cristão, ministração, culto"
              />
              <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
            </div>

            <div className="space-y-2">
              <Label>Imagem Open Graph</Label>
              <p className="text-xs text-muted-foreground">
                Imagem exibida ao compartilhar nas redes sociais (1200x630px recomendado)
              </p>
              <div className="flex items-center gap-4">
                {getValue('seo_og_image_url') && (
                  <img
                    src={getValue('seo_og_image_url')}
                    alt="OG Image"
                    className="w-32 h-16 object-cover rounded border"
                  />
                )}
                <div>
                  <input
                    ref={ogImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => ogImageRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload Imagem'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview do Google */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Preview no Google
              </CardTitle>
              <CardDescription>Como seu app aparece nos resultados de busca</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-lg border">
                <div className="space-y-1">
                  <p className="text-xs text-green-700">https://seuapp.lovable.app</p>
                  <h3 className="text-lg text-blue-800 hover:underline cursor-pointer">
                    {getValue('seo_title') || 'Título do seu app'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {getValue('seo_description') || 'Descrição do seu app aparecerá aqui...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview Redes Sociais</CardTitle>
              <CardDescription>Como aparece ao compartilhar no Facebook/LinkedIn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                {getValue('seo_og_image_url') ? (
                  <img
                    src={getValue('seo_og_image_url')}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Sem imagem OG</span>
                  </div>
                )}
                <div className="p-3 border-t">
                  <p className="text-xs text-gray-500 uppercase">seuapp.lovable.app</p>
                  <h4 className="font-semibold text-gray-900 line-clamp-1">
                    {getValue('seo_title') || 'Título do app'}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {getValue('seo_description') || 'Descrição do app...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSEO;
