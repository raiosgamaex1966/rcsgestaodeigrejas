import { useState } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette, Save, RotateCcw, Plus, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

const defaultColors = {
  primary_color: '262 83% 58%',
  secondary_color: '222 47% 15%',
  accent_color: '38 92% 50%',
  background_color: '222 47% 6%',
  foreground_color: '210 40% 98%',
  gold_color: '38 92% 50%',
  burgundy_color: '345 75% 35%',
};

const colorLabels: Record<string, { label: string; description: string }> = {
  primary_color: { label: 'Cor de Cabeçalho e Botões', description: 'Cor principal para o topo (grade) e botões do sistema' },
  secondary_color: { label: 'Cor de Destaque Secundário', description: 'Cor usada em menus e sub-elementos' },
  accent_color: { label: 'Cor de Alerta/Notificação', description: 'Cor vermelha para ícones importantes e alertas' },
  background_color: { label: 'Cor de Fundo das Páginas', description: 'Cor suave de fundo por trás dos cards' },
  foreground_color: { label: 'Cor dos Textos Principais', description: 'Cor para títulos e parágrafos' },
};

const contactLabels: Record<string, { label: string; description: string; placeholder: string }> = {
  contact_address: { label: 'Endereço da Igreja', description: 'Endereço completo para exibição no rodapé', placeholder: 'Rua Exemplo, 123, Bairro, Cidade - UF' },
  contact_phone: { label: 'Telefone de Contato', description: 'WhatsApp ou telefone fixo principal', placeholder: '(00) 00000-0000' },
  website_url: { label: 'Link do Site Externo', description: 'URL do site oficial ou redes sociais', placeholder: 'https://www.exemplo.com' },
};

// Converter HSL string para hex
const hslToHex = (hsl: string): string => {
  const parts = hsl.split(' ').map(p => parseFloat(p));
  if (parts.length !== 3) return '#000000';

  const h = parts[0];
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Converter hex para HSL string
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const AdminAppearance = () => {
  const { settings, isLoading, updateSettings } = useChurchSettings();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [newLink, setNewLink] = useState({ label: '', url: '' });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) {
      toast.error('Preencha o nome e o link');
      return;
    }

    const currentLinks = formData.useful_links ?? settings?.useful_links ?? [];
    const updatedLinks = [...currentLinks, { ...newLink }];

    handleFieldChange('useful_links', updatedLinks);
    setNewLink({ label: '', url: '' });
    toast.success('Link adicionado à lista. Clique em Salvar para confirmar.');
  };

  const handleRemoveLink = (index: number) => {
    const currentLinks = formData.useful_links ?? settings?.useful_links ?? [];
    const updatedLinks = currentLinks.filter((_: any, i: number) => i !== index);
    handleFieldChange('useful_links', updatedLinks);
  };

  const handleColorChange = (field: string, hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    handleFieldChange(field, hslValue);

    // Preview em tempo real
    document.documentElement.style.setProperty(`--${field.replace('_color', '').replace('_', '-')}`, hslValue);
  };

  const handleSave = () => {
    if (Object.keys(formData).length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    updateSettings.mutate(formData);
    setFormData({});
  };

  const handleReset = () => {
    setFormData(defaultColors);
    Object.entries(defaultColors).forEach(([key, value]) => {
      const cssVar = `--${key.replace('_color', '').replace('_', '-')}`;
      document.documentElement.style.setProperty(cssVar, value);
    });
    toast.info('Cores resetadas para o padrão. Clique em Salvar para confirmar.');
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
    return formData[field] ?? (typeof settingsValue === 'string' ? settingsValue : '') ?? defaultColors[field as keyof typeof defaultColors] ?? '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aparência do Aplicativo</h1>
          <p className="text-sm text-muted-foreground">Personalize as cores e veja o resultado nas miniaturas abaixo</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="h-9 w-full sm:w-auto order-2 sm:order-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending || Object.keys(formData).length === 0}
            className="h-9 w-full sm:w-auto order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Mudanças
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Cores do Tema
              </CardTitle>
              <CardDescription>As alterações são visualizadas em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              {Object.entries(colorLabels).map(([field, { label, description }]) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="text-sm sm:text-base font-semibold">{label}</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <input
                        type="color"
                        id={field}
                        value={hslToHex(getValue(field))}
                        onChange={(e) => handleColorChange(field, e.target.value)}
                        className="w-12 h-10 rounded-lg cursor-pointer border-2 border-border/50 hover:border-primary transition-colors bg-transparent p-0 overflow-hidden"
                      />
                    </div>
                    <Input
                      value={getValue(field)}
                      readOnly
                      className="font-mono text-xs sm:text-sm flex-1 bg-muted/30"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Informações de Contato (Rodapé)
              </CardTitle>
              <CardDescription>Configurações para o rodapé do site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              {Object.entries(contactLabels).map(([field, { label, description, placeholder }]) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="text-sm sm:text-base font-semibold">{label}</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  <Input
                    id={field}
                    value={getValue(field)}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Links Úteis (Rodapé)
              </CardTitle>
              <CardDescription>Gerencie os links que aparecem no rodapé do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nome do Link</Label>
                    <Input
                      value={newLink.label}
                      onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Ex: Facebook"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Endereço (URL)</Label>
                    <Input
                      value={newLink.url}
                      onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://facebook.com/minha-igreja"
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={handleAddLink}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Link à Lista
                </Button>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Links Atuais</Label>
                <div className="space-y-2">
                  {(formData.useful_links ?? settings?.useful_links ?? []).map((link: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group">
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="text-sm font-medium truncate">{link.label}</span>
                        <span className="text-xs text-muted-foreground truncate">{link.url}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveLink(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {(formData.useful_links ?? settings?.useful_links ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                      Nenhum link personalizado cadastrado.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Miniaturas (Preview)</CardTitle>
            <CardDescription>Veja como o app fica em diferentes telas</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Web Miniature */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Versão Desktop (Site)</span>
                <div className="aspect-video w-full rounded-xl border border-border bg-background shadow-soft overflow-hidden scale-100 origin-top">
                  {/* Miniature Web Header */}
                  <div className="h-8 w-full bg-primary flex items-center justify-between px-3">
                    <div className="w-12 h-2 bg-white/20 rounded" />
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-white/20 rounded-full" />
                      <div className="w-3 h-3 bg-white/20 rounded-full" />
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-2/3 space-y-2">
                        <div className="h-3 w-20 bg-primary/10 rounded" />
                        <div className="h-10 w-full bg-card border rounded-lg" />
                        <div className="h-10 w-full bg-card border rounded-lg" />
                      </div>
                      <div className="w-1/3 space-y-2">
                        <div className="h-3 w-full bg-secondary/20 rounded" />
                        <div className="h-20 w-full bg-card border rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Miniature */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Versão Mobile (Celular)</span>
                <div className="flex justify-center">
                  <div className="w-[180px] h-[320px] rounded-[2rem] border-4 border-slate-800 bg-background shadow-2xl overflow-hidden relative">
                    {/* Header Gradient */}
                    <div className="h-16 w-full bg-primary relative overflow-hidden flex flex-col justify-end p-3">
                      <div className="h-2 w-10 bg-white/30 rounded mb-1" />
                      <div className="h-3 w-16 bg-white rounded" />
                      {/* Circle decos */}
                      <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    </div>
                    {/* Content */}
                    <div className="p-3 space-y-3">
                      <div className="h-16 w-full bg-card rounded-xl border border-border shadow-soft flex items-center justify-center">
                        <div className="w-full h-full p-2 space-y-1">
                          <div className="h-2 w-1/2 bg-muted rounded" />
                          <div className="h-2 w-3/4 bg-muted/50 rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 bg-card border rounded-lg" />
                        <div className="h-12 bg-card border rounded-lg" />
                      </div>
                      <div className="h-12 w-full bg-accent rounded-lg flex items-center justify-center">
                        <div className="h-2 w-1/3 bg-white/50 rounded" />
                      </div>
                    </div>
                    {/* Tab Bar */}
                    <div className="absolute bottom-0 w-full h-10 border-t bg-card flex justify-around items-center px-2">
                      <div className="w-4 h-4 bg-primary rounded" />
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="w-4 h-4 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAppearance;
