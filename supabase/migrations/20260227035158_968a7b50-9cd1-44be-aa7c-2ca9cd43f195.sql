
-- Create discipulos table
CREATE TABLE public.discipulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitante_id UUID NOT NULL REFERENCES public.visitantes(id) ON DELETE CASCADE,
  discipulador_id UUID NOT NULL REFERENCES auth.users(id),
  discipulador_nome TEXT NOT NULL,
  progresso_percentual INTEGER NOT NULL DEFAULT 0,
  licoes_concluidas INTEGER NOT NULL DEFAULT 0,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_cor public.status_cor_enum NOT NULL DEFAULT 'vermelho',
  ultima_atividade TIMESTAMP WITH TIME ZONE,
  UNIQUE(visitante_id)
);

-- Create licoes table to track each lesson
CREATE TABLE public.licoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulo_id UUID NOT NULL REFERENCES public.discipulos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero >= 1 AND numero <= 13),
  concluida BOOLEAN NOT NULL DEFAULT false,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  UNIQUE(discipulo_id, numero)
);

-- Enable RLS
ALTER TABLE public.discipulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licoes ENABLE ROW LEVEL SECURITY;

-- discipulos: discipulador sees own, rede sees all
CREATE POLICY "discipulos_select" ON public.discipulos
  FOR SELECT USING (
    CASE public.get_user_tipo_acesso()
      WHEN 'discipulador' THEN discipulador_id = auth.uid()
      WHEN 'rede' THEN true
      ELSE false
    END
  );

CREATE POLICY "discipulos_insert" ON public.discipulos
  FOR INSERT WITH CHECK (
    public.get_user_tipo_acesso() IN ('discipulador', 'rede')
  );

CREATE POLICY "discipulos_update" ON public.discipulos
  FOR UPDATE USING (
    CASE public.get_user_tipo_acesso()
      WHEN 'discipulador' THEN discipulador_id = auth.uid()
      WHEN 'rede' THEN true
      ELSE false
    END
  );

CREATE POLICY "discipulos_delete" ON public.discipulos
  FOR DELETE USING (
    public.get_user_tipo_acesso() = 'rede'
  );

-- licoes: same access as parent discipulo
CREATE POLICY "licoes_select" ON public.licoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discipulos d WHERE d.id = discipulo_id
      AND (
        CASE public.get_user_tipo_acesso()
          WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
          WHEN 'rede' THEN true
          ELSE false
        END
      )
    )
  );

CREATE POLICY "licoes_insert" ON public.licoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.discipulos d WHERE d.id = discipulo_id
      AND (
        CASE public.get_user_tipo_acesso()
          WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
          WHEN 'rede' THEN true
          ELSE false
        END
      )
    )
  );

CREATE POLICY "licoes_update" ON public.licoes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.discipulos d WHERE d.id = discipulo_id
      AND (
        CASE public.get_user_tipo_acesso()
          WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
          WHEN 'rede' THEN true
          ELSE false
        END
      )
    )
  );

-- Trigger: auto-create 13 lessons when discipulo is inserted
CREATE OR REPLACE FUNCTION public.create_licoes_for_discipulo()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.licoes (discipulo_id, numero)
  SELECT NEW.id, generate_series(1, 13);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_create_licoes
  AFTER INSERT ON public.discipulos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_licoes_for_discipulo();

-- Trigger: update discipulo progress when licao changes
CREATE OR REPLACE FUNCTION public.update_discipulo_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_done INTEGER;
  last_activity TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT COUNT(*) INTO total_done
  FROM public.licoes
  WHERE discipulo_id = COALESCE(NEW.discipulo_id, OLD.discipulo_id) AND concluida = true;

  SELECT MAX(data_conclusao) INTO last_activity
  FROM public.licoes
  WHERE discipulo_id = COALESCE(NEW.discipulo_id, OLD.discipulo_id) AND concluida = true;

  UPDATE public.discipulos SET
    licoes_concluidas = total_done,
    progresso_percentual = ROUND((total_done::numeric / 13) * 100),
    ultima_atividade = last_activity,
    status_cor = CASE
      WHEN total_done = 0 THEN 'vermelho'
      WHEN last_activity IS NULL OR last_activity < now() - interval '15 days' THEN 'amarelo'
      ELSE 'verde'
    END
  WHERE id = COALESCE(NEW.discipulo_id, OLD.discipulo_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_progress
  AFTER INSERT OR UPDATE ON public.licoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discipulo_progress();
