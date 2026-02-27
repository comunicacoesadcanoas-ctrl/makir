
-- Create status_sessao enum
CREATE TYPE public.status_sessao_enum AS ENUM ('presente', 'ausente', 'reagendado');

-- Create relatorios table
CREATE TABLE public.relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID NOT NULL REFERENCES public.discipulos(id) ON DELETE CASCADE,
  discipulador_id UUID NOT NULL,
  licao_numero INTEGER NOT NULL CHECK (licao_numero BETWEEN 1 AND 13),
  observacoes TEXT NOT NULL,
  status_sessao status_sessao_enum NOT NULL DEFAULT 'presente',
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

-- SELECT: discipulador sees own, rede sees all
CREATE POLICY "relatorios_select" ON public.relatorios
FOR SELECT TO authenticated
USING (
  CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false
  END
);

-- INSERT: discipulador/rede can insert their own
CREATE POLICY "relatorios_insert" ON public.relatorios
FOR INSERT TO authenticated
WITH CHECK (
  get_user_tipo_acesso() IN ('discipulador', 'rede')
  AND discipulador_id = auth.uid()
);

-- UPDATE: own or admin
CREATE POLICY "relatorios_update" ON public.relatorios
FOR UPDATE TO authenticated
USING (
  CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false
  END
);

-- DELETE: only admin
CREATE POLICY "relatorios_delete" ON public.relatorios
FOR DELETE TO authenticated
USING (get_user_tipo_acesso() = 'rede');

-- Index for common queries
CREATE INDEX idx_relatorios_discipulo ON public.relatorios(discipulo_id);
CREATE INDEX idx_relatorios_discipulador ON public.relatorios(discipulador_id);
