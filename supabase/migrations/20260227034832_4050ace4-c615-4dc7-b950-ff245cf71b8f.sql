
-- Create enums for visitantes
CREATE TYPE public.estado_civil_enum AS ENUM ('solteiro', 'casado', 'divorciado');
CREATE TYPE public.sexo_enum AS ENUM ('masculino', 'feminino');
CREATE TYPE public.status_cor_enum AS ENUM ('vermelho', 'amarelo', 'verde');

-- Create visitantes table
CREATE TABLE public.visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cidade TEXT,
  endereco TEXT,
  ano TEXT,
  observacoes TEXT,
  aceitou_jesus BOOLEAN NOT NULL DEFAULT false,
  frequenta_igreja BOOLEAN NOT NULL DEFAULT false,
  quer_gc BOOLEAN NOT NULL DEFAULT false,
  quer_discipulado BOOLEAN NOT NULL DEFAULT false,
  estado_civil public.estado_civil_enum,
  sexo public.sexo_enum,
  status_cor public.status_cor_enum NOT NULL DEFAULT 'vermelho',
  cadastrado_por UUID NOT NULL REFERENCES auth.users(id),
  cadastrado_por_nome TEXT NOT NULL,
  assumido_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

-- Recepcao (acesso 01): can CRUD their own visitantes
-- Discipulador (acesso 02): can read visitantes registered by anyone (via policy, read-only enforced in UI)
-- Rede (acesso 03): full access to all visitantes

-- Helper: get current user tipo_acesso without recursion
CREATE OR REPLACE FUNCTION public.get_user_tipo_acesso()
RETURNS public.tipo_acesso_enum AS $$
  SELECT tipo_acesso FROM public.users WHERE id = auth.uid() AND status = 'aprovado'
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- SELECT: all approved users can see visitantes
-- Recepcao sees only their own, others see all
CREATE POLICY "visitantes_select" ON public.visitantes
  FOR SELECT USING (
    CASE public.get_user_tipo_acesso()
      WHEN 'recepcao' THEN cadastrado_por = auth.uid()
      WHEN 'discipulador' THEN true
      WHEN 'rede' THEN true
      ELSE false
    END
  );

-- INSERT: recepcao and rede can insert
CREATE POLICY "visitantes_insert" ON public.visitantes
  FOR INSERT WITH CHECK (
    public.get_user_tipo_acesso() IN ('recepcao', 'rede')
    AND cadastrado_por = auth.uid()
  );

-- UPDATE: recepcao updates own, rede updates all
CREATE POLICY "visitantes_update" ON public.visitantes
  FOR UPDATE USING (
    CASE public.get_user_tipo_acesso()
      WHEN 'recepcao' THEN cadastrado_por = auth.uid()
      WHEN 'rede' THEN true
      ELSE false
    END
  );

-- DELETE: recepcao deletes own, rede deletes all
CREATE POLICY "visitantes_delete" ON public.visitantes
  FOR DELETE USING (
    CASE public.get_user_tipo_acesso()
      WHEN 'recepcao' THEN cadastrado_por = auth.uid()
      WHEN 'rede' THEN true
      ELSE false
    END
  );

-- Auto-update status_cor based on quer_discipulado and assumido_por
CREATE OR REPLACE FUNCTION public.update_visitante_status_cor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assumido_por IS NOT NULL THEN
    NEW.status_cor = 'verde';
  ELSIF NEW.quer_discipulado = true THEN
    NEW.status_cor = 'amarelo';
  ELSE
    NEW.status_cor = 'vermelho';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_visitante_status_cor
  BEFORE INSERT OR UPDATE ON public.visitantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visitante_status_cor();
