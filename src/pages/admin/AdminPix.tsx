import { useState, useRef } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, QrCode, Copy, Save, CreditCard } from "lucide-react";
import { toast } from "sonner";

const AdminPix = () => {
  const { settings, isLoading, updateSettings, uploadAsset } = useChurchSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const qrcodeInputRef = useRef<HTMLInputElement>(null);

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
      toast.success('QR Code enviado com sucesso!');
    }
    setUploading(false);
  };

  const copyPix = () => {
    const pixKey = getValue('pix_key');
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      toast.success('Chave PIX copiada!');
    }
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
          <h1 className="text-2xl font-bold text-foreground">Configurações do PIX</h1>
          <p className="text-muted-foreground">Gerencie as informações de pagamento via PIX</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending || Object.keys(formData).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Chave PIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Chave PIX
            </CardTitle>
            <CardDescription>Configure a chave PIX para receber doações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pix_key_type">Tipo da Chave</Label>
              <Select
                value={getValue('pix_key_type') || 'CNPJ'}
                onValueChange={(value) => handleChange('pix_key_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="TELEFONE">Telefone</SelectItem>
                  <SelectItem value="ALEATORIA">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <div className="flex gap-2">
                <Input
                  id="pix_key"
                  value={getValue('pix_key')}
                  onChange={(e) => handleChange('pix_key', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copyPix} title="Copiar chave">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta chave será exibida na página de ofertas para os membros copiarem
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_beneficiary_name">Nome do Beneficiário</Label>
              <Input
                id="pix_beneficiary_name"
                value={getValue('pix_beneficiary_name')}
                onChange={(e) => handleChange('pix_beneficiary_name', e.target.value)}
                placeholder="Igreja RCS Gestão"
              />
              <p className="text-xs text-muted-foreground">
                Nome que aparecerá no comprovante de pagamento
              </p>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code PIX
            </CardTitle>
            <CardDescription>Faça upload do QR Code para pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imagem do QR Code</Label>
              <div className="flex flex-col items-center gap-4">
                {getValue('pix_qrcode_url') ? (
                  <div className="p-4 bg-secondary rounded-lg">
                    <img
                      src={getValue('pix_qrcode_url')}
                      alt="QR Code PIX"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-secondary rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={qrcodeInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'pix_qrcode_url', 'pix')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => qrcodeInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Upload QR Code'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Gere o QR Code no app do seu banco e faça upload da imagem
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Instruções para Doação</CardTitle>
            <CardDescription>Texto de orientação exibido na página de ofertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pix_instructions">Mensagem de Instrução</Label>
              <Textarea
                id="pix_instructions"
                value={getValue('pix_instructions')}
                onChange={(e) => handleChange('pix_instructions', e.target.value)}
                placeholder="Escaneie o QR Code ou copie a chave PIX para fazer sua contribuição"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>Como será exibido na página de ofertas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto p-4 bg-secondary rounded-lg space-y-4">
              <div className="text-center">
                {getValue('pix_qrcode_url') ? (
                  <img
                    src={getValue('pix_qrcode_url')}
                    alt="QR Code PIX"
                    className="w-32 h-32 mx-auto object-contain mb-3"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto bg-foreground/10 rounded-lg mb-3 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-2">
                  {getValue('pix_key_type') || 'CNPJ'}
                </p>
                <p className="font-mono text-sm font-medium text-foreground">
                  {getValue('pix_key') || '00.000.000/0001-00'}
                </p>
                {getValue('pix_beneficiary_name') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getValue('pix_beneficiary_name')}
                  </p>
                )}
              </div>
              <Button variant="secondary" className="w-full" disabled>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Chave PIX
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {getValue('pix_instructions') || 'Escaneie o QR Code ou copie a chave PIX para fazer sua contribuição'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPix;