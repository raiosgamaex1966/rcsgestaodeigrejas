-- Habilitar RLS nas tabelas se ainda não estiverem
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_activity ENABLE ROW LEVEL SECURITY;

-- Políticas para user_gamification
-- 1. Permitir que cada usuário veja seus próprios dados
DROP POLICY IF EXISTS "Users can view own gamification" ON public.user_gamification;
CREATE POLICY "Users can view own gamification"
ON public.user_gamification FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permitir que usuários vejam os dados de outros para o Ranking (SELECT global)
DROP POLICY IF EXISTS "Users can view all for leaderboard" ON public.user_gamification;
CREATE POLICY "Users can view all for leaderboard"
ON public.user_gamification FOR SELECT
TO authenticated
USING (true);

-- 3. Permitir que usuários atualizem seus próprios pontos
DROP POLICY IF EXISTS "Users can update own gamification" ON public.user_gamification;
CREATE POLICY "Users can update own gamification"
ON public.user_gamification FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para reading_history
DROP POLICY IF EXISTS "Users can manage own history" ON public.reading_history;
CREATE POLICY "Users can manage own history"
ON public.reading_history FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para reading_activity
DROP POLICY IF EXISTS "Users can insert own activity" ON public.reading_activity;
CREATE POLICY "Users can insert own activity"
ON public.reading_activity FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity" ON public.reading_activity;
CREATE POLICY "Users can view own activity"
ON public.reading_activity FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
