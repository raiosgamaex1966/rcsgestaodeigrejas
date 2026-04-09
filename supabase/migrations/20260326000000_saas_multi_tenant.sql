-- Migração: Transição para SaaS Multi-tenant
-- Descrição: Cria a tabela de tenants, adiciona tenant_id às tabelas existentes e configura RLS.

-- 1. Criar tabela de Tenants (Clientes/Igrejas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    trial_ends_at timestamp with time zone DEFAULT (now() + interval '4 days'),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS em tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Criar tabelas solicitadas (Placeholder se não existirem)
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    phone text,
    category text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id),
    recipient_id uuid, -- Pode ser ID de perfil ou número de telefone
    content text NOT NULL,
    status text DEFAULT 'sent',
    type text DEFAULT 'whatsapp', -- whatsapp, email, sms
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    status text DEFAULT 'disconnected',
    session_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Adicionar tenant_id às tabelas existentes
-- Nota: Para tabelas existentes, precisaremos de um Tenant padrão inicialmente ou permitir NULL temporariamente.
-- Criaremos um tenant padrão para migração de dados existentes.
DO $$
DECLARE
    default_tenant_id uuid;
BEGIN
    INSERT INTO public.tenants (name, slug) 
    VALUES ('Padrão', 'padrao') 
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO default_tenant_id;

    -- profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tenant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.profiles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- church_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='church_settings' AND column_name='tenant_id') THEN
        ALTER TABLE public.church_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.church_settings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- campaigns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='tenant_id') THEN
        ALTER TABLE public.campaigns ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.campaigns SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='tenant_id') THEN
        ALTER TABLE public.events ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.events SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- courses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='tenant_id') THEN
        ALTER TABLE public.courses ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.courses SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- sermons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sermons' AND column_name='tenant_id') THEN
        ALTER TABLE public.sermons ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.sermons SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='requests' AND column_name='tenant_id') THEN
        ALTER TABLE public.requests ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
        UPDATE public.requests SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

END $$;

-- 4. Habilitar RLS e Criar Políticas de Isolamento
-- Exemplo para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver apenas dados do seu tenant" ON public.profiles;
CREATE POLICY "Usuários podem ver apenas dados do seu tenant" ON public.profiles
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Repetir para outras tabelas conforme necessário
-- ... (vou expandir isso na execução real)

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
