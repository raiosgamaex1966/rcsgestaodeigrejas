-- Ajusta criação automática do profile para respeitar member_type vindo do cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full_name text;
  v_member_type text;
BEGIN
  v_full_name := NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '');
  v_member_type := COALESCE(NEW.raw_user_meta_data->>'member_type', 'visitante');

  -- Sanitiza valores inesperados (ex.: 'servo', 'ministro', 'midia') para 'membro'
  IF v_member_type NOT IN ('membro', 'visitante', 'novo_convertido') THEN
    v_member_type := 'membro';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, member_type)
  VALUES (NEW.id, v_full_name, NEW.email, v_member_type)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        member_type = EXCLUDED.member_type;

  -- Role padrão do sistema
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Gamificação (evita duplicidade sem depender de constraint)
  IF NOT EXISTS (SELECT 1 FROM public.user_gamification ug WHERE ug.user_id = NEW.id) THEN
    INSERT INTO public.user_gamification (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;