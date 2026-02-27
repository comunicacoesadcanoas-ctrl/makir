
-- Tabela de membros do GC
CREATE TABLE public.membros_gc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_id uuid NOT NULL REFERENCES public.grupos_crescimento(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  discipulo_id uuid REFERENCES public.discipulos(id) ON DELETE SET NULL,
  tipo_entrada text NOT NULL DEFAULT 'manual' CHECK (tipo_entrada IN ('visitante_convertido', 'manual')),
  data_entrada date NOT NULL DEFAULT CURRENT_DATE,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de frequência mensal do GC
CREATE TABLE public.frequencia_gc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_id uuid NOT NULL REFERENCES public.grupos_crescimento(id) ON DELETE CASCADE,
  mes_referencia text NOT NULL, -- formato: 2024-01
  presentes integer NOT NULL DEFAULT 0,
  observacoes text,
  registrado_por uuid NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gc_id, mes_referencia)
);

-- RLS membros_gc
ALTER TABLE public.membros_gc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membros_gc_select" ON public.membros_gc FOR SELECT
  USING (get_user_tipo_acesso() IN ('discipulador', 'rede'));

CREATE POLICY "membros_gc_insert" ON public.membros_gc FOR INSERT
  WITH CHECK (get_user_tipo_acesso() = 'rede');

CREATE POLICY "membros_gc_delete" ON public.membros_gc FOR DELETE
  USING (get_user_tipo_acesso() = 'rede');

-- RLS frequencia_gc
ALTER TABLE public.frequencia_gc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frequencia_gc_select" ON public.frequencia_gc FOR SELECT
  USING (get_user_tipo_acesso() IN ('discipulador', 'rede'));

CREATE POLICY "frequencia_gc_insert" ON public.frequencia_gc FOR INSERT
  WITH CHECK (get_user_tipo_acesso() IN ('discipulador', 'rede'));

CREATE POLICY "frequencia_gc_update" ON public.frequencia_gc FOR UPDATE
  USING (get_user_tipo_acesso() IN ('discipulador', 'rede'));

-- Trigger para atualizar total_membros do GC
CREATE OR REPLACE FUNCTION public.update_gc_total_membros()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.grupos_crescimento SET total_membros = (
    SELECT COUNT(*) FROM public.membros_gc WHERE gc_id = COALESCE(NEW.gc_id, OLD.gc_id)
  ) WHERE id = COALESCE(NEW.gc_id, OLD.gc_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_gc_membros_insert
  AFTER INSERT ON public.membros_gc
  FOR EACH ROW EXECUTE FUNCTION public.update_gc_total_membros();

CREATE TRIGGER trg_update_gc_membros_delete
  AFTER DELETE ON public.membros_gc
  FOR EACH ROW EXECUTE FUNCTION public.update_gc_total_membros();
