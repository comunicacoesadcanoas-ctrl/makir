
-- Create status enum for GCs
CREATE TYPE public.status_gc_enum AS ENUM ('ativo', 'em_formacao', 'inativo');

-- Create grupos_crescimento table
CREATE TABLE public.grupos_crescimento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  lider_nome TEXT NOT NULL,
  lider_email TEXT,
  lider_usuario_id UUID,
  endereco TEXT,
  bairro TEXT,
  zona TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  dia_encontro TEXT[] DEFAULT '{}',
  horario TEXT,
  capacidade INTEGER DEFAULT 20,
  total_membros INTEGER DEFAULT 0,
  telefone_contato TEXT,
  status_gc status_gc_enum NOT NULL DEFAULT 'ativo',
  status_cor status_cor_enum NOT NULL DEFAULT 'verde',
  observacoes TEXT,
  data_inicio DATE DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grupos_crescimento ENABLE ROW LEVEL SECURITY;

-- SELECT: discipulador and rede can view all
CREATE POLICY "gc_select" ON public.grupos_crescimento
FOR SELECT TO authenticated
USING (
  get_user_tipo_acesso() IN ('discipulador', 'rede')
);

-- INSERT: only rede
CREATE POLICY "gc_insert" ON public.grupos_crescimento
FOR INSERT TO authenticated
WITH CHECK (get_user_tipo_acesso() = 'rede');

-- UPDATE: only rede
CREATE POLICY "gc_update" ON public.grupos_crescimento
FOR UPDATE TO authenticated
USING (get_user_tipo_acesso() = 'rede');

-- DELETE: only rede
CREATE POLICY "gc_delete" ON public.grupos_crescimento
FOR DELETE TO authenticated
USING (get_user_tipo_acesso() = 'rede');

-- Index
CREATE INDEX idx_gc_status ON public.grupos_crescimento(status_gc);
