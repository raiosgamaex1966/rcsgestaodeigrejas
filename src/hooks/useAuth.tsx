import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseNoSession } from '@/integrations/supabase/signupClient';

type AppRole = 'owner' | 'admin' | 'moderator' | 'user' | 'visitante' | 'membro' | 'servo' | 'ministro' | 'midia' | 'tesoureiro' | 'conselho';

// Demo admin email for read-only admin access
const DEMO_ADMIN_EMAIL = 'admin-demo@rcsgestao.com';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, churchName?: string, phone?: string, taxId?: string, existingTenantId?: string, memberType?: string) => Promise<{ error: Error | null; session: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isMember: boolean;
  isVisitor: boolean;
  userRole: AppRole | null;
  isApproved: boolean;
  tenantId: string | null;
  tenant: {
    name: string;
    slug: string;
    trial_ends_at: string | null;
    is_active: boolean;
  } | null;
  isTrialExpired: boolean;
  isMinistro: boolean;
  isMidia: boolean;
  isTesoureiro: boolean;
  isConselho: boolean;
  canRecord: boolean;
  canCreateSermon: boolean;
  canApproveExpenses: boolean;
  canViewAudit: boolean;
  getTenantPath: (path: string) => string;
  resolveTenantBySlug: (slug: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<{ name: string, slug: string, trial_ends_at: string | null, is_active: boolean } | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);

  // Computed member flag
  const isMemberRole = (role: AppRole | null) => {
    if (!role) return false;
    return ['owner', 'admin', 'moderator', 'membro', 'servo', 'ministro', 'midia', 'tesoureiro', 'conselho'].includes(role);
  };

  const isMember = isMemberRole(userRole);
  const isVisitor = !user || userRole === 'visitante' || userRole === 'user' || userRole === null;

  // Helper para gerar paths tenant-aware
  const getTenantPath = useCallback((path: string): string => {
    if (!tenant?.slug) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/app/${tenant.slug}${cleanPath}`;
  }, [tenant?.slug]);

  const resolveTenantBySlug = async (slug: string) => {
    const { data: tenantData, error } = await supabase
      .from('tenants')
      .select('id, name, slug, trial_ends_at, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (tenantData && !error) {
      setTenantId(tenantData.id);
      setTenant(tenantData);
      return tenantData.id;
    }
    return null;
  };

  const checkUserRole = async (userId: string, userEmail: string | undefined) => {
    // Check if this is the demo admin - grant admin access without database check
    if (userEmail?.toLowerCase() === DEMO_ADMIN_EMAIL) {
      setUserRole('admin');
      setIsAdmin(true);
      setIsApproved(true);
      setAdminChecked(true);
      return;
    }

    let resolvedRole: AppRole | null = null;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData) {
      resolvedRole = roleData.role as AppRole;
      setUserRole(resolvedRole);
      setIsAdmin(resolvedRole === 'admin' || resolvedRole === 'owner');
    } else {
      setUserRole(null);
      setIsAdmin(false);
    }

    // Fetch tenant info from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('tenant_id, is_approved')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      // Admins e owners são sempre aprovados, independente do valor no banco
      const isAdminOrOwner = resolvedRole === 'admin' || resolvedRole === 'owner';
      setIsApproved(isAdminOrOwner || (profileData.is_approved ?? false));
      
      if (profileData.tenant_id) {
        setTenantId(profileData.tenant_id);
      
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('name, slug, trial_ends_at, is_active')
          .eq('id', profileData.tenant_id)
          .maybeSingle();
      
        if (tenantData) {
          setTenant(tenantData);
        }
      }
    }

    setAdminChecked(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id, session.user.email);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserRole(null);
          setAdminChecked(true);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkUserRole(session.user.id, session.user.email);
      } else {
        setAdminChecked(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    churchName?: string,
    phone?: string,
    taxId?: string,
    existingTenantId?: string,
    memberType: string = 'membro'
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    let resolvedTenantId = existingTenantId || null;
    let initialRole: AppRole = 'membro';
    // Membros via link público NÃO são aprovados automaticamente
    // Apenas admins convidados pelo SuperAdmin são aprovados automaticamente
    let initialApproved = false;

    if (existingTenantId) {
      // Convidado como admin pelo SuperAdmin → aprovado automaticamente
      initialRole = 'admin';
      initialApproved = true;
      resolvedTenantId = existingTenantId;
    } else if (churchName) {
      // Fundador da igreja → cria o tenant e é o admin/aprovado
      const slug = churchName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar se já existe
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('name', churchName)
        .maybeSingle();

      if (existingTenant) {
        resolvedTenantId = existingTenant.id;
        initialRole = 'admin';
        initialApproved = true;
        // Apenas associa ao tenant existente. O signUp normal segue abaixo.
        // Se o email já existir no Auth, o fallback para signIn é feito após o signUp falhar.
      } else {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert({ 
            name: churchName,
            slug: slug || `igreja-${Math.random().toString(36).slice(2, 7)}`,
            tax_id: taxId
          })
          .select('id')
          .single();

        if (tenantError) throw tenantError;
        resolvedTenantId = tenantData.id;
        initialRole = 'admin';
        initialApproved = true;
      }
    }

    // Para admin convidado pelo SuperAdmin: usar cliente principal (persiste sessão → login automático)
    // Para quem está se associando a uma igreja existente: também usar cliente principal
    // Para membro público (nova igreja): usar supabaseNoSession (não persiste sessão → exige aprovação antes de entrar)
    const isPrivilegedSignup = !!existingTenantId || (!!resolvedTenantId && initialRole === 'admin');
    const authClient = isPrivilegedSignup ? supabase : supabaseNoSession;

    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          member_type: memberType,
          phone: phone,
          tenant_id: resolvedTenantId,
          role: initialRole,
          is_approved: initialApproved,
        }
      }
    });

    // Fallback: se o signUp falhar porque o email já existe
    if (error && error.message.includes('already registered')) {
      // Tentar signIn automaticamente
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!signInError && signInData.session) {
        // Atualizar perfil com nome e telefone fornecidos no formulário
        if (fullName || phone) {
          await supabase
            .from('profiles')
            .update({
              ...(fullName ? { full_name: fullName } : {}),
              ...(phone ? { phone } : {}),
              ...(resolvedTenantId ? { tenant_id: resolvedTenantId } : {}),
              is_approved: initialApproved,
            })
            .eq('id', signInData.session.user.id);
        }
        // Garantir que o role esteja correto
        if (initialRole === 'admin') {
          await supabase
            .from('user_roles')
            .upsert({ user_id: signInData.session.user.id, role: 'admin' }, { onConflict: 'user_id' });
        }
        return { error: null, session: signInData.session };
      }
      
      // Se o signIn falhar, precisamos dizer o porquê de forma clara
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          return { error: new Error('Este e-mail já tem uma conta no sistema, mas a senha está incorreta. Se você esqueceu, vá em "Já tem conta? Faça login" e clique em "Esqueceu a senha".'), session: null };
        }
        if (signInError.message.includes("Email not confirmed")) {
          return { error: new Error('Este e-mail já foi cadastrado, mas ainda não foi confirmado. Verifique sua caixa de entrada.'), session: null };
        }
        return { error: new Error(`Erro ao entrar: ${signInError.message}`), session: null };
      }
    }
    
    // Se o erro for de banco de dados (ex: trigger falhou), retornar traduzido mas identificável
    if (error && error.message.includes('Database error')) {
      return { error: new Error('Erro no banco de dados ao salvar o usuário. O suporte técnico precisa analisar a tabela profiles/user_roles.'), session: null };
    }

    return { error: error as Error | null, session: data.session };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsAdmin(false);
      setUserRole(null);
      setTenantId(null);
      setTenant(null);
      setAdminChecked(false);
      // Limpar todos os dados locais para garantir um estado limpo
      localStorage.clear();
      sessionStorage.clear();
      // Forçar redirecionamento para a tela de login
      window.location.href = '/auth';
    }
  };

  const isFullyLoaded = !loading && adminChecked;

  // Computed permissions
  const isMinistro = userRole === 'ministro';
  const isMidia = userRole === 'midia';
  const isTesoureiro = userRole === 'tesoureiro';
  const isConselho = userRole === 'conselho';
  const canRecord = isAdmin || isMidia;
  const canCreateSermon = isAdmin || isMinistro;
  const canApproveExpenses = isAdmin || isTesoureiro || isConselho;
  const canViewAudit = isAdmin || isConselho;

  const isTrialExpired = !!tenant && 
    !tenant.is_active && 
    !!tenant.trial_ends_at && 
    new Date() > new Date(tenant.trial_ends_at);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading: !isFullyLoaded,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isMember,
      isVisitor,
      userRole,
      isApproved,
      tenantId,
      tenant,
      isTrialExpired,
      isMinistro,
      isMidia,
      isTesoureiro,
      isConselho,
      canRecord,
      canCreateSermon,
      canApproveExpenses,
      canViewAudit,
      getTenantPath,
      resolveTenantBySlug
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
