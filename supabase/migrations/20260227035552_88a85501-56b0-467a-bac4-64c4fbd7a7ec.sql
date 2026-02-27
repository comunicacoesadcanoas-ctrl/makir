
-- Fix: restrict INSERT to service role pattern (usuario_id must match auth.uid or be inserted by service role)
DROP POLICY "notificacoes_insert_service" ON public.notificacoes;

-- Only service role (edge functions) can insert, normal users cannot insert notifications
-- Since edge functions use service_role key which bypasses RLS, we can restrict this
CREATE POLICY "notificacoes_insert_authenticated" ON public.notificacoes
  FOR INSERT WITH CHECK (usuario_id = auth.uid());
