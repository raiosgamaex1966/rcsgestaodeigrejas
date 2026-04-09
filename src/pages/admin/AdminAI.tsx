import { useState, useEffect } from "react";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Key, Eye, EyeOff, CheckCircle2, XCircle, ExternalLink, AlertTriangle, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const chatModels = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Mais rápido e econômico" },
  { value: "gpt-4o", label: "GPT-4o", description: "Alta qualidade" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Balanceado" },
];

const generationModels = [
  { value: "gpt-4o", label: "GPT-4o", description: "Recomendado - Alta qualidade" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Mais econômico" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Alternativa" },
];

const AdminAI = () => {
  const { settings, isLoading, updateSettings } = useChurchSettings();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [chatModel, setChatModel] = useState("gpt-4o-mini");
  const [generationModel, setGenerationModel] = useState("gpt-4o");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");

  useEffect(() => {
    if (settings) {
      setApiKey(settings.openai_api_key || "");
      setChatModel(settings.ai_model_chat || "gpt-4o-mini");
      setGenerationModel(settings.ai_model_generation || "gpt-4o");
      if (settings.ai_enabled) {
        setValidationStatus("valid");
      }
    }
  }, [settings]);

  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return key;
    return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
  };

  const handleValidateKey = async () => {
    if (!apiKey || !apiKey.startsWith("sk-")) {
      toast.error("Por favor, insira uma chave API válida (deve começar com sk-)");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      const { data, error } = await supabase.functions.invoke("validate-openai-key", {
        body: { apiKey },
      });

      if (error) throw error;

      if (data?.valid) {
        setValidationStatus("valid");
        toast.success("Chave API válida! Você pode salvar as configurações.");
      } else {
        setValidationStatus("invalid");
        toast.error(data?.error || "Chave API inválida");
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      setValidationStatus("invalid");
      toast.error("Erro ao validar chave: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (apiKey && validationStatus !== "valid") {
      toast.error("Por favor, valide a chave API antes de salvar");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings.mutateAsync({
        openai_api_key: apiKey || null,
        ai_enabled: validationStatus === "valid",
        ai_model_chat: chatModel,
        ai_model_generation: generationModel,
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    setIsSaving(true);
    try {
      await updateSettings.mutateAsync({
        openai_api_key: null,
        ai_enabled: false,
      });
      setApiKey("");
      setValidationStatus("idle");
      toast.success("Chave removida com sucesso");
    } catch (error) {
      console.error("Remove error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Inteligência Artificial
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a integração com OpenAI para transcrição e geração de ministrações
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Status da IA
            {settings?.ai_enabled ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ativa
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Inativa
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings?.ai_enabled ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Funcionalidades de IA estão disponíveis: transcrição automática e geração de ministrações.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              <span>Configure sua chave API da OpenAI para habilitar as funcionalidades de IA.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Chave API OpenAI
          </CardTitle>
          <CardDescription>
            Sua chave API é armazenada de forma segura e utilizada apenas para processar ministrações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationStatus("idle");
                  }}
                  placeholder="sk-..."
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleValidateKey}
                disabled={isValidating || !apiKey}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Testar"
                )}
              </Button>
            </div>

            {validationStatus === "valid" && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Chave válida e pronta para uso
              </p>
            )}
            {validationStatus === "invalid" && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Chave inválida ou sem permissões
              </p>
            )}
          </div>

          {settings?.openai_api_key && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Chave atual: <span className="font-mono">{maskApiKey(settings.openai_api_key)}</span>
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-destructive"
                onClick={handleRemoveKey}
                disabled={isSaving}
              >
                Remover chave
              </Button>
            </div>
          )}

          <Alert>
            <Key className="w-4 h-4" />
            <AlertTitle>Como obter sua chave API</AlertTitle>
            <AlertDescription className="space-y-2">
              <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">platform.openai.com <ExternalLink className="w-3 h-3" /></a></li>
                <li>Faça login ou crie uma conta</li>
                <li>Vá em "API Keys" e clique em "Create new secret key"</li>
                <li>Copie a chave e cole aqui</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Dica: Você precisa ter créditos na sua conta OpenAI para usar a API.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Models Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Modelos de IA
          </CardTitle>
          <CardDescription>
            Escolha os modelos para cada tipo de tarefa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Modelo para Análise
              </Label>
              <Select value={chatModel} onValueChange={setChatModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chatModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span className="font-medium group-focus:text-white">{model.label}</span>
                        <span className="text-xs text-muted-foreground group-focus:text-white/80">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Usado para transcrição de áudio e análise de ministrações
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Modelo para Geração
              </Label>
              <Select value={generationModel} onValueChange={setGenerationModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generationModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span className="font-medium group-focus:text-white">{model.label}</span>
                        <span className="text-xs text-muted-foreground group-focus:text-white/80">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Usado para criar ministrações com IA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminAI;
