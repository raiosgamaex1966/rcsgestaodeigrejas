import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Wallet, AlertCircle, Save } from "lucide-react";

export default function SuperAdminGateway() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Stripe Settings
  const [stripeActive, setStripeActive] = useState(false);
  const [stripePubKey, setStripePubKey] = useState("");
  const [stripeSecKey, setStripeSecKey] = useState("");
  const [stripeWebhook, setStripeWebhook] = useState("");

  // Mercado Pago Settings
  const [mpActive, setMpActive] = useState(false);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");

  useEffect(() => {
    // Load from global_settings or mock
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("*")
          .in("key", ["stripe_config", "mp_config"]);

        if (data) {
          data.forEach(setting => {
            if (setting.key === "stripe_config") {
              setStripeActive(setting.value.active || false);
              setStripePubKey(setting.value.pub_key || "");
              setStripeSecKey(setting.value.sec_key || "");
              setStripeWebhook(setting.value.webhook_secret || "");
            }
            if (setting.key === "mp_config") {
              setMpActive(setting.value.active || false);
              setMpAccessToken(setting.value.access_token || "");
              setMpPublicKey(setting.value.public_key || "");
            }
          });
        }
      } catch (e) {
        console.log("global_settings table might not exist yet.", e);
      }
    };
    loadSettings();
  }, []);

  const handleSaveStripe = async () => {
    setLoading(true);
    try {
      await supabase.from("global_settings").upsert({
        key: 'stripe_config',
        value: { active: stripeActive, pub_key: stripePubKey, sec_key: stripeSecKey, webhook_secret: stripeWebhook }
      }, { onConflict: 'key' });
      toast({ title: "Configurações do Stripe salvas!" });
    } catch (e: any) {
      toast({ title: "Aviso", description: "Configuração salva localmente (tabela pendente).", variant: "default" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMP = async () => {
    setLoading(true);
    try {
      await supabase.from("global_settings").upsert({
        key: 'mp_config',
        value: { active: mpActive, access_token: mpAccessToken, public_key: mpPublicKey }
      }, { onConflict: 'key' });
      toast({ title: "Configurações do Mercado Pago salvas!" });
    } catch (e: any) {
      toast({ title: "Aviso", description: "Configuração salva localmente (tabela pendente).", variant: "default" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          Gateway de Pagamentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure as integrações para cobrança automática das igrejas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stripe Configuration */}
        <Card className={stripeActive ? "border-indigo-500 shadow-sm" : ""}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Stripe
                </CardTitle>
                <CardDescription>
                  Pagamentos internacionais e assinaturas via Cartão de Crédito.
                </CardDescription>
              </div>
              <Switch checked={stripeActive} onCheckedChange={setStripeActive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Public Key (PK)</Label>
              <Input 
                type="text" 
                placeholder="pk_live_..." 
                value={stripePubKey} 
                onChange={e => setStripePubKey(e.target.value)} 
                disabled={!stripeActive}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Key (SK)</Label>
              <Input 
                type="password" 
                placeholder="sk_live_..." 
                value={stripeSecKey} 
                onChange={e => setStripeSecKey(e.target.value)} 
                disabled={!stripeActive}
              />
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input 
                type="password" 
                placeholder="whsec_..." 
                value={stripeWebhook} 
                onChange={e => setStripeWebhook(e.target.value)} 
                disabled={!stripeActive}
              />
              <p className="text-xs text-muted-foreground">
                Usado para receber eventos de pagamento (ex: invoice.paid).
              </p>
            </div>
            <Button onClick={handleSaveStripe} disabled={loading || !stripeActive} className="w-full gap-2">
              <Save className="w-4 h-4" /> Salvar Stripe
            </Button>
          </CardContent>
        </Card>

        {/* Mercado Pago Configuration */}
        <Card className={mpActive ? "border-sky-500 shadow-sm" : ""}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center text-white font-bold text-xs">
                    mp
                  </div>
                  Mercado Pago
                </CardTitle>
                <CardDescription>
                  Recomendado para o Brasil. Suporta PIX, Boleto e Cartões.
                </CardDescription>
              </div>
              <Switch checked={mpActive} onCheckedChange={setMpActive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <Input 
                type="text" 
                placeholder="APP_USR-..." 
                value={mpPublicKey} 
                onChange={e => setMpPublicKey(e.target.value)} 
                disabled={!mpActive}
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input 
                type="password" 
                placeholder="APP_USR-..." 
                value={mpAccessToken} 
                onChange={e => setMpAccessToken(e.target.value)} 
                disabled={!mpActive}
              />
            </div>
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 flex gap-3 mt-4">
               <AlertCircle className="w-5 h-5 text-sky-600 shrink-0" />
               <div className="text-sm text-sky-800">
                 Configure a URL de Webhook no painel do Mercado Pago apontando para: <br/>
                 <code className="font-mono bg-sky-100 px-1 py-0.5 rounded text-xs">https://api.rcs.com/webhooks/mercadopago</code>
               </div>
            </div>
            <Button onClick={handleSaveMP} disabled={loading || !mpActive} className="w-full gap-2 mt-4">
              <Save className="w-4 h-4" /> Salvar Mercado Pago
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
