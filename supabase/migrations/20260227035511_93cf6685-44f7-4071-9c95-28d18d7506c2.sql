
-- Create notificacoes table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (usuario_id = auth.uid());

-- Service role inserts (from edge function)
CREATE POLICY "notificacoes_insert_service" ON public.notificacoes
  FOR INSERT WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to update discipulo status based on ultima_atividade
CREATE OR REPLACE FUNCTION public.atualizar_status_discipulos()
RETURNS void AS $$
BEGIN
  UPDATE public.discipulos SET
    status_cor = CASE
      WHEN licoes_concluidas = 0 THEN 'vermelho'
      WHEN ultima_atividade IS NULL THEN 'vermelho'
      WHEN ultima_atividade < now() - interval '30 days' THEN 'vermelho'
      WHEN ultima_atividade < now() - interval '15 days' THEN 'amarelo'
      ELSE 'verde'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
