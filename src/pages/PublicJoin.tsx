import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseNoSession } from "@/integrations/supabase/signupClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Phone, Church as ChurchIcon } from "lucide-react";

const PublicJoin = () => {
  const { churchSlug } = useParams();
  const slug = churchSlug; // Using churchSlug to match App.tsx route
  const navigate = useNavigate();
  const [church, setChurch] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchChurch = async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        toast.error("O link utilizado é inválido ou a igreja não existe.");
        navigate("/auth");
      } else {
        setChurch(data);
      }
      setLoading(false);
    };

    if (slug) fetchChurch();
  }, [slug, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);

    try {
      const { data, error } = await supabaseNoSession.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            tenant_id: church?.id,
            role: 'membro',
            is_approved: false // Membros via link público aguardam aprovação manual
          }
        }
      });

      if (error) throw error;

      // Se a sessão for criada automaticamente (email confirm off), faz logout
      // para forçar o fluxo de aprovação antes de acessar o app
      if (data.session) {
        await supabaseNoSession.auth.signOut();
      }

      toast.success(`Solicitação enviada com sucesso! Aguarde a aprovação do responsável pela ${church?.name}.`);
      // Redireciona para tela de login com mensagem adequada
      navigate(`/${church ? slug : 'auth'}/auth`);
    } catch (error: any) {
      let errorMessage = error.message || "Erro ao cadastrar";
      if (errorMessage.includes("already registered")) {
        errorMessage = "Este email já está cadastrado.";
      } else if (errorMessage.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Credenciais inválidas.";
      }
      toast.error(errorMessage);
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="RCS Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-foreground">Solicitar Entrada</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
            <ChurchIcon className="w-4 h-4" /> {church?.name}
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Cadastro de Membro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar sua participação nesta igreja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-10" 
                    placeholder="Seu nome completo" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    className="pl-10" 
                    placeholder="(00) 00000-0000" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="pl-10" 
                    placeholder="seu@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10" 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={signingUp}>
                {signingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Solicitação"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicJoin;
