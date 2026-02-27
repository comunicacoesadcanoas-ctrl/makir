
-- Create status enum for access requests
CREATE TYPE public.status_solicitacao_enum AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Create access requests table
CREATE TABLE public.solicitacoes_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  acesso_atual public.tipo_acesso_enum NOT NULL,
  acesso_solicitado public.tipo_acesso_enum NOT NULL,
  status public.status_solicitacao_enum NOT NULL DEFAULT 'pendente',
  observacao text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  avaliado_em timestamp with time zone,
  avaliado_por uuid
);

-- Unique index: one pending request per user per access type
CREATE UNIQUE INDEX idx_solicitacoes_unique_pending 
ON public.solicitacoes_acesso (user_id, acesso_solicitado) 
WHERE status = 'pendente';

-- Enable RLS
ALTER TABLE public.solicitacoes_acesso ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
ON public.solicitacoes_acesso FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can see their own requests; admins see all
CREATE POLICY "Users see own or admin sees all"
ON public.solicitacoes_acesso FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Only admins can update (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.solicitacoes_acesso FOR UPDATE
TO authenticated
USING (is_admin());
