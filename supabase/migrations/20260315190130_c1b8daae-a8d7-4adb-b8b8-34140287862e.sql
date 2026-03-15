
-- Add new enum values and distrito_id column
ALTER TYPE tipo_acesso_enum ADD VALUE IF NOT EXISTS 'lider_distrito';
ALTER TYPE tipo_acesso_enum ADD VALUE IF NOT EXISTS 'lider_congregacao';

ALTER TABLE users ADD COLUMN IF NOT EXISTS distrito_id uuid REFERENCES distritos(id);

-- Helper functions (these don't reference new enum values directly)
CREATE OR REPLACE FUNCTION public.get_user_distrito_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT distrito_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.congregacao_in_user_distrito(cong_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.congregacoes c
    JOIN public.users u ON u.id = auth.uid()
    WHERE c.id = cong_id
      AND c.distrito_id = u.distrito_id
      AND u.distrito_id IS NOT NULL
  )
$$;
