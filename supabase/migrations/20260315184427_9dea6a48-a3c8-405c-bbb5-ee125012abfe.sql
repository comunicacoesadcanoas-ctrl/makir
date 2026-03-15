-- 1. Create distritos table
CREATE TABLE public.distritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.distritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distritos_select" ON public.distritos FOR SELECT TO public
  USING (get_user_tipo_acesso() IS NOT NULL);

CREATE POLICY "distritos_insert" ON public.distritos FOR INSERT TO public
  WITH CHECK (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

CREATE POLICY "distritos_update" ON public.distritos FOR UPDATE TO public
  USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

CREATE POLICY "distritos_delete" ON public.distritos FOR DELETE TO public
  USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- 2. Create congregacoes table
CREATE TABLE public.congregacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distrito_id uuid NOT NULL REFERENCES public.distritos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cidade text,
  pastor text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.congregacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "congregacoes_select" ON public.congregacoes FOR SELECT TO public
  USING (get_user_tipo_acesso() IS NOT NULL);

CREATE POLICY "congregacoes_insert" ON public.congregacoes FOR INSERT TO public
  WITH CHECK (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

CREATE POLICY "congregacoes_update" ON public.congregacoes FOR UPDATE TO public
  USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

CREATE POLICY "congregacoes_delete" ON public.congregacoes FOR DELETE TO public
  USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- 3. Add congregacao_id to users, visitantes, discipulos
ALTER TABLE public.users ADD COLUMN congregacao_id uuid REFERENCES public.congregacoes(id);
ALTER TABLE public.visitantes ADD COLUMN congregacao_id uuid REFERENCES public.congregacoes(id);
ALTER TABLE public.discipulos ADD COLUMN congregacao_id uuid REFERENCES public.congregacoes(id);

-- 4. Helper function
CREATE OR REPLACE FUNCTION public.get_user_congregacao_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
  SELECT congregacao_id FROM public.users WHERE id = auth.uid()
$$;

-- 5. Update visitantes RLS
DROP POLICY IF EXISTS "visitantes_select" ON public.visitantes;
CREATE POLICY "visitantes_select" ON public.visitantes FOR SELECT TO public
  USING (
    CASE get_user_tipo_acesso()
      WHEN 'recepcao'::tipo_acesso_enum THEN cadastrado_por = auth.uid()
      WHEN 'discipulador'::tipo_acesso_enum THEN (
        get_user_congregacao_id() IS NULL 
        OR congregacao_id IS NULL 
        OR congregacao_id = get_user_congregacao_id()
      )
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  );

DROP POLICY IF EXISTS "visitantes_insert" ON public.visitantes;
CREATE POLICY "visitantes_insert" ON public.visitantes FOR INSERT TO public
  WITH CHECK (
    (get_user_tipo_acesso() = ANY (ARRAY['recepcao'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]))
    AND cadastrado_por = auth.uid()
  );

DROP POLICY IF EXISTS "visitantes_update" ON public.visitantes;
CREATE POLICY "visitantes_update" ON public.visitantes FOR UPDATE TO public
  USING (
    CASE get_user_tipo_acesso()
      WHEN 'recepcao'::tipo_acesso_enum THEN cadastrado_por = auth.uid()
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  );

DROP POLICY IF EXISTS "visitantes_delete" ON public.visitantes;
CREATE POLICY "visitantes_delete" ON public.visitantes FOR DELETE TO public
  USING (
    CASE get_user_tipo_acesso()
      WHEN 'recepcao'::tipo_acesso_enum THEN cadastrado_por = auth.uid()
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  );

-- 6. Update discipulos RLS
DROP POLICY IF EXISTS "discipulos_select" ON public.discipulos;
CREATE POLICY "discipulos_select" ON public.discipulos FOR SELECT TO public
  USING (
    CASE get_user_tipo_acesso()
      WHEN 'discipulador'::tipo_acesso_enum THEN (
        discipulador_id = auth.uid()
        OR (get_user_congregacao_id() IS NOT NULL AND congregacao_id = get_user_congregacao_id())
      )
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  );

DROP POLICY IF EXISTS "discipulos_update" ON public.discipulos;
CREATE POLICY "discipulos_update" ON public.discipulos FOR UPDATE TO public
  USING (
    CASE get_user_tipo_acesso()
      WHEN 'discipulador'::tipo_acesso_enum THEN discipulador_id = auth.uid()
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  );

-- 7. Update users SELECT policy
DROP POLICY IF EXISTS "Users can view own row or admin sees all" ON public.users;
CREATE POLICY "Users can view own row or admin sees all" ON public.users FOR SELECT TO public
  USING (
    id = auth.uid()
    OR is_admin()
    OR (
      get_user_tipo_acesso() = 'discipulador'::tipo_acesso_enum
      AND tipo_acesso IN ('discipulador', 'recepcao')
      AND (
        get_user_congregacao_id() IS NULL
        OR congregacao_id IS NULL
        OR congregacao_id = get_user_congregacao_id()
      )
    )
  );

-- 8. Seed distritos
INSERT INTO public.distritos (numero, nome) VALUES
  (1, 'Mathias Velho'),
  (3, 'Vila Cerne'),
  (4, 'Getúlio Vargas'),
  (5, 'Antena'),
  (6, 'São Sepé'),
  (7, 'Maria Isabel'),
  (8, 'São Pedro'),
  (9, 'Fátima'),
  (10, 'Primavera'),
  (11, 'Via do Parque'),
  (12, 'Arambaré');

-- 9. Seed congregacoes
WITH d AS (SELECT id, numero FROM public.distritos)
INSERT INTO public.congregacoes (distrito_id, nome)
SELECT d.id, c.nome FROM d
JOIN (VALUES
  (1, 'Mathias Velho'), (1, 'Harmonia'), (1, 'Mato Grande'), (1, 'Centro'), (1, 'Passo Fundo'), (1, 'São Luís'),
  (3, 'Vila Cerne'), (3, 'Rondinha'),
  (4, 'Getúlio Vargas'),
  (5, 'Antena'), (5, 'Santo Ângelo'),
  (6, 'São Sepé'), (6, 'Erechim'),
  (7, 'Maria Isabel'), (7, 'Libertação'), (7, 'Indio Sepé'),
  (8, 'São Pedro'), (8, 'Santo Operário'), (8, 'Santos Dias'),
  (9, 'Fátima'), (9, 'Ana Maria'), (9, 'Prata'),
  (10, 'Primavera'), (10, 'Bandeirantes'),
  (11, 'Via do Parque'), (11, 'Boa Saúde'),
  (12, 'Arambaré')
) AS c(distrito_numero, nome) ON d.numero = c.distrito_numero;