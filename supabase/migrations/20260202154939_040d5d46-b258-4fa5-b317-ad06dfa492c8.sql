-- Permitir admin fazer UPDATE nas roles de outros usuários
CREATE POLICY "Admins can update any role"
  ON public.user_roles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));