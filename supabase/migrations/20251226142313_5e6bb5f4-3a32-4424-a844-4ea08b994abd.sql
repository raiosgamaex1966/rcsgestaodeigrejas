-- =============================================
-- SPRINT 1: Módulo de Membros, Células e Grupos
-- =============================================

-- 1. Expandir tabela profiles com novos campos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wedding_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baptism_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS conversion_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_since date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_complement text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_neighborhood text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_zip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_type text DEFAULT 'visitante';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matricula text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Tabela de Células/Pequenos Grupos
CREATE TABLE IF NOT EXISTS public.cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES public.profiles(id),
  co_leader_id uuid REFERENCES public.profiles(id),
  address text,
  neighborhood text,
  city text,
  meeting_day text,
  meeting_time time,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cells are viewable by everyone" ON public.cells
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cells" ON public.cells
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Tabela de Membros das Células
CREATE TABLE IF NOT EXISTS public.cell_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id uuid REFERENCES public.cells(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'participante',
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(cell_id, member_id)
);

ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cell members are viewable by everyone" ON public.cell_members
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cell members" ON public.cell_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Tabela de Atendimento Pastoral
CREATE TABLE IF NOT EXISTS public.pastoral_care (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  attended_by uuid REFERENCES public.profiles(id),
  reason text NOT NULL,
  description text,
  date date DEFAULT CURRENT_DATE,
  follow_up_date date,
  status text DEFAULT 'open',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.pastoral_care ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pastoral care" ON public.pastoral_care
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Tabela de Equipes/Ministérios
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES public.profiles(id),
  icon text DEFAULT 'Users',
  color text DEFAULT '#6366f1',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Tabela de Membros das Equipes
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'membro',
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(team_id, member_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Tabela de Histórico de Membros
CREATE TABLE IF NOT EXISTS public.member_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  description text,
  date date DEFAULT CURRENT_DATE,
  performed_by uuid REFERENCES public.profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.member_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage member history" ON public.member_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Tabela de Jornadas de Discipulado
CREATE TABLE IF NOT EXISTS public.journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journeys are viewable by everyone" ON public.journeys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage journeys" ON public.journeys
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Tabela de Etapas das Jornadas
CREATE TABLE IF NOT EXISTS public.journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journey steps are viewable by everyone" ON public.journey_steps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage journey steps" ON public.journey_steps
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Tabela de Progresso nas Jornadas
CREATE TABLE IF NOT EXISTS public.journey_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  step_id uuid REFERENCES public.journey_steps(id) ON DELETE CASCADE,
  status text DEFAULT 'iniciado',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, journey_id, step_id)
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey progress" ON public.journey_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own journey progress" ON public.journey_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all journey progress" ON public.journey_progress
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON public.cells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pastoral_care_updated_at
  BEFORE UPDATE ON public.pastoral_care
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON public.journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();