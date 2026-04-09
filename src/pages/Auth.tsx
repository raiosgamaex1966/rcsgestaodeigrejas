import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Loader2, Users, Church, Phone, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [churchName, setChurchName] = useState("");
  const [taxId, setTaxId] = useState("");

  const [targetTenantId, setTargetTenantId] = useState<string | null>(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("tid");
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp, user, tenant, loading: authLoading, userRole } = useAuth();
  const { settings, isLoading: themeLoading } = useTheme();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { churchSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [hasProvisionalParams, setHasProvisionalParams] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    return !!(sp.get("email") || sp.get("p"));
  });
  const hasInitialModeSet = useRef(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (tenant?.slug) {
        navigate(`/app/${tenant.slug}`);
      } else if (userRole === 'owner') {
        navigate("/superadmin");
      } else {
        // Avoid redirecting to /app if there's no tenant and not owner,
        // it would just bounce back to /auth causing a login trembling loop.
      }
    }
  }, [user, navigate, tenant, authLoading, userRole]);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qPass = searchParams.get("p");
    const qMode = searchParams.get("mode");
    const qChurch = searchParams.get("cn");
    const qTid = searchParams.get("tid");
    
    console.log("[Auth] Params:", { email: !!qEmail, p: !!qPass, mode: qMode, church: !!qChurch, tid: !!qTid, initialSet: hasInitialModeSet.current });

    if (qEmail || qPass || qMode) {
      const qTaxId = searchParams.get("tax_id");
      
      if (qEmail && email === "") setEmail(qEmail);
      if (qPass && password === "") setPassword(qPass);
      if (qChurch && churchName === "") setChurchName(qChurch);
      if (qTaxId && taxId === "") setTaxId(qTaxId);
      if (qTid) setTargetTenantId(qTid);
      
      if (qMode === "signup") {
        setIsLogin(false);
      } else if (qMode === "login") {
        setIsLogin(true);
      } else {
        // Fallback for older links
        setIsLogin(!!qEmail);
      }

      if (qEmail || qPass) setHasProvisionalParams(true);
      hasInitialModeSet.current = true;
    } else if (churchSlug && tenant && tenant.name && !hasInitialModeSet.current) {
      console.log("[Auth] Defaulting to signup (no params found)");
      setChurchName(tenant.name);
      setIsLogin(false);
      hasInitialModeSet.current = true;
    }
  }, [churchSlug, tenant, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          let message = error.message;
          if (message === "Invalid login credentials") message = "Email ou senha incorretos";
          if (message === "Email not confirmed") message = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
          if (message === "User not found") message = "Usuário não encontrado";
          
          toast.error(message);
        } else {
          toast.success("Bem-vindo de volta!");
          // NÃO redirecionar aqui manualmente.
          // O useEffect abaixo monitora `user` e `tenant` após o AuthProvider atualizar,
          // e então faz o redirecionamento correto — incluindo a checagem do ApprovalGuard.
          // Isso evita que usuários não aprovados passem direto para o app.
        }
      } else {
        if (password.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
          setLoading(false);
          return;
        }

        // Se temos um targetTenantId, não passamos o churchName para evitar criação duplicada de inquilino
        const signupChurchName = targetTenantId ? undefined : churchName;
        const isAdminInvite = !!targetTenantId; // Convite de admin pelo SuperAdmin
        console.log("[Auth] Attempting signup with:", { email, signupChurchName, targetTenantId, isAdminInvite });
        const { error, session } = await signUp(email, password, fullName, signupChurchName, phone, taxId, targetTenantId || undefined);
        if (error) {
          // Mostrar mensagem de erro clara e amigável
          toast.error(error.message);
        } else if (session) {
          // Temos uma sessão ativa.
          if (isAdminInvite || signupChurchName) {
            // Admin convidado pelo SuperAdmin OU fundador criando nova igreja (login automático via igreja existente)
            // → sessão ativa, o useEffect vai redirecionar automaticamente.
            toast.success(`Bem-vindo! Seu acesso está pronto. Redirecionando...`);
          } else {
            // Membro público com confirmação de e-mail desligada no Supabase:
            // forçar logout para exigir aprovação do admin antes de entrar.
            await supabase.auth.signOut();
            toast.success("Conta criada com sucesso! Aguarde a aprovação do responsável para acessar o sistema.");
            setIsLogin(true);
          }
        } else {
          if (isAdminInvite) {
            // Convidado pelo SuperAdmin mas confirmação de e-mail está ativa
            toast.info("Verifique seu e-mail para confirmar a conta e, em seguida, faça o login.");
            setIsLogin(true);
          } else {
            // Membro público → precisa de aprovação do admin da igreja
            toast.success("Conta criada com sucesso! Aguarde a aprovação do responsável para acessar o sistema.");
            setIsLogin(true);
          }
        }
      }
    } catch (err: any) {
      console.error("[Auth] Unexpected Error:", err);
      toast.error(`Erro: ${err.message || "Tente novamente mais tarde."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Verifique sua caixa de entrada para redefinir a senha.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md animate-scale-in space-y-4">
        {/* Logo RCS */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="RCS Gestão de Igrejas"
            className="h-20 w-auto mx-auto mb-2 object-contain drop-shadow-xl animate-float"
          />
          <h1 className="text-4xl font-serif font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 tracking-tight">
            RCS Gestão de Igrejas
          </h1>
        </div>

        <Card variant="elevated" className="shadow-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif">
              {isLogin ? "Entrar" : "Criar Conta"}
            </CardTitle>
            {hasProvisionalParams && !isLogin && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left text-xs text-blue-800">
                  <p className="font-bold mb-1">Convite de Administrador!</p>
                  <p>Preparamos seu acesso da <strong>{churchName}</strong>. Complete seu nome e telefone abaixo para ativar o seu painel administrativo.</p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {hasProvisionalParams && isLogin && (
              <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 font-bold">Aviso de Segurança</AlertTitle>
                <AlertDescription className="text-amber-800">
                  Após o seu primeiro acesso, favor trocar a senha provisória por uma senha de sua preferência no seu perfil.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome"
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="church">Nome da Igreja</Label>
                    <div className="relative">
                      <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="church"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                        placeholder="Nome da sua instituição"
                        className="pl-10"
                        required={!isLogin}
                        disabled={(!!churchSlug && !!tenant) || hasProvisionalParams}
                      />
                    </div>
                  </div>



                    <div className="space-y-2">
                      <Label htmlFor="taxId">CNPJ ou CPF (Responsável)</Label>
                      <div className="relative group">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="taxId"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder="000.000.000-00"
                          className="pl-10 h-11 border-muted-foreground/20 focus:border-primary"
                          required={!isLogin && !hasProvisionalParams}
                          disabled={hasProvisionalParams}
                        />
                      </div>
                    </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={hasProvisionalParams}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    minLength={6}
                    disabled={hasProvisionalParams}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  isLogin ? "Entrar" : "Criar Conta"
                )}
              </Button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm text-primary hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}
            </form>

            {!hasProvisionalParams && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin
                    ? "Não tem conta? Cadastre-se"
                    : "Já tem conta? Faça login"
                  }
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Digite seu email para receber um link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Enviar Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
