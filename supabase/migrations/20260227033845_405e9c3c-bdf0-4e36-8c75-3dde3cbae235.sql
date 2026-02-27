
-- Create enums
CREATE TYPE public.tipo_acesso_enum AS ENUM ('recepcao', 'discipulador', 'rede');
CREATE TYPE public.status_enum AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  foto_url TEXT,
  tipo_acesso public.tipo_acesso_enum NOT NULL,
  status public.status_enum NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND status = 'aprovado'
      AND tipo_acesso = 'rede'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- RLS: SELECT - users can see their own row, admins can see all
CREATE POLICY "Users can view own row or admin sees all"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

-- RLS: INSERT - users can insert their own row (on first login)
CREATE POLICY "Users can insert own row"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- RLS: UPDATE - users can update own row, admins can update all
CREATE POLICY "Users can update own row or admin updates all"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

-- No DELETE policy (nobody can delete)
