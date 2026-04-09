-- Garante que as colunas necessárias existam em profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS member_type text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Recria a trigger com tratamento robusto para não gerar erros no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name text;
  v_member_type text;
  v_phone text;
  v_tenant_id uuid;
  v_is_approved boolean;
  v_role_text text;
BEGIN
  -- 1. Extração segura de texto
  v_full_name := NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '');
  v_member_type := COALESCE(NEW.raw_user_meta_data->>'member_type', 'membro');
  v_phone := NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '');
  v_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Sanitiza o member_type para valores permitidos previstos no sistema
  IF v_member_type NOT IN ('membro', 'visitante', 'novo_convertido') THEN
    v_member_type := 'membro';
  END IF;

  -- 2. Conversões seguras de UUID e BOOLEAN para evitar exceções (Database Error)
  BEGIN
    v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;
  
  BEGIN
    v_is_approved := (NEW.raw_user_meta_data->>'is_approved')::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_is_approved := false;
  END;

  -- 3. Inserir ou Atualizar Dados Principais em PROFILES
  INSERT INTO public.profiles (id, full_name, email, member_type, phone, tenant_id, is_approved)
  VALUES (NEW.id, v_full_name, NEW.email, v_member_type, v_phone, v_tenant_id, v_is_approved)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        member_type = EXCLUDED.member_type,
        phone = EXCLUDED.phone,
        tenant_id = EXCLUDED.tenant_id,
        is_approved = EXCLUDED.is_approved;

  -- 4. Inserir a Permissão de Acesso em USER_ROLES de forma segura
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role_text::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END;

  -- 5. Gamificação (evita duplicidade sem depender de constraint de forma silenciosa)
  IF NOT EXISTS (SELECT 1 FROM public.user_gamification ug WHERE ug.user_id = NEW.id) THEN
    INSERT INTO public.user_gamification (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;
