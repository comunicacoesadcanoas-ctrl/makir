
-- Drop and recreate visitantes policies
DROP POLICY IF EXISTS "visitantes_select" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_insert" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_update" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_delete" ON public.visitantes;

CREATE POLICY "visitantes_select" ON public.visitantes FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "visitantes_insert" ON public.visitantes FOR INSERT
  WITH CHECK (
    get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
    AND cadastrado_por = auth.uid()
  );

CREATE POLICY "visitantes_update" ON public.visitantes FOR UPDATE USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "visitantes_delete" ON public.visitantes FOR DELETE USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

-- Drop and recreate discipulos policies
DROP POLICY IF EXISTS "discipulos_select" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_insert" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_update" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_delete" ON public.discipulos;

CREATE POLICY "discipulos_select" ON public.discipulos FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "discipulos_insert" ON public.discipulos FOR INSERT
  WITH CHECK (get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum));

CREATE POLICY "discipulos_update" ON public.discipulos FOR UPDATE USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "discipulos_delete" ON public.discipulos FOR DELETE USING (
  get_user_tipo_acesso() = 'rede'::tipo_acesso_enum
);

-- Drop and recreate relatorios policies
DROP POLICY IF EXISTS "relatorios_select" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_insert" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_update" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_delete" ON public.relatorios;

CREATE POLICY "relatorios_select" ON public.relatorios FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN EXISTS (
      SELECT 1 FROM discipulos d WHERE d.id = relatorios.discipulo_id AND d.congregacao_id = get_user_congregacao_id()
    )
    WHEN 'lider_distrito'::tipo_acesso_enum THEN EXISTS (
      SELECT 1 FROM discipulos d WHERE d.id = relatorios.discipulo_id AND congregacao_in_user_distrito(d.congregacao_id)
    )
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "relatorios_insert" ON public.relatorios FOR INSERT
  WITH CHECK (
    get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
    AND discipulador_id = auth.uid()
  );

CREATE POLICY "relatorios_update" ON public.relatorios FOR UPDATE USING (
  CASE get_user_tipo_acesso()
    WHEN 'lider_congregacao'::tipo_acesso_enum THEN (discipulador_id = auth.uid())
    WHEN 'lider_distrito'::tipo_acesso_enum THEN (discipulador_id = auth.uid())
    WHEN 'rede'::tipo_acesso_enum THEN true
    ELSE false
  END
);

CREATE POLICY "relatorios_delete" ON public.relatorios FOR DELETE USING (
  get_user_tipo_acesso() = 'rede'::tipo_acesso_enum
);

-- Drop and recreate licoes policies
DROP POLICY IF EXISTS "licoes_select" ON public.licoes;
DROP POLICY IF EXISTS "licoes_insert" ON public.licoes;
DROP POLICY IF EXISTS "licoes_update" ON public.licoes;

CREATE POLICY "licoes_select" ON public.licoes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'lider_congregacao'::tipo_acesso_enum THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  )
);

CREATE POLICY "licoes_insert" ON public.licoes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'lider_congregacao'::tipo_acesso_enum THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  )
);

CREATE POLICY "licoes_update" ON public.licoes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'lider_congregacao'::tipo_acesso_enum THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito'::tipo_acesso_enum THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede'::tipo_acesso_enum THEN true
      ELSE false
    END
  )
);

-- Drop and recreate frequencia_gc policies
DROP POLICY IF EXISTS "frequencia_gc_select" ON public.frequencia_gc;
DROP POLICY IF EXISTS "frequencia_gc_insert" ON public.frequencia_gc;
DROP POLICY IF EXISTS "frequencia_gc_update" ON public.frequencia_gc;

CREATE POLICY "frequencia_gc_select" ON public.frequencia_gc FOR SELECT USING (
  get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
);

CREATE POLICY "frequencia_gc_insert" ON public.frequencia_gc FOR INSERT WITH CHECK (
  get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
);

CREATE POLICY "frequencia_gc_update" ON public.frequencia_gc FOR UPDATE USING (
  get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
);

-- Drop and recreate gc policies
DROP POLICY IF EXISTS "gc_select" ON public.grupos_crescimento;

CREATE POLICY "gc_select" ON public.grupos_crescimento FOR SELECT USING (
  get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
);

-- Drop and recreate membros_gc policies
DROP POLICY IF EXISTS "membros_gc_select" ON public.membros_gc;

CREATE POLICY "membros_gc_select" ON public.membros_gc FOR SELECT USING (
  get_user_tipo_acesso() IN ('lider_congregacao'::tipo_acesso_enum, 'lider_distrito'::tipo_acesso_enum, 'rede'::tipo_acesso_enum)
);

-- Drop and recreate users SELECT policy
DROP POLICY IF EXISTS "Users can view own row or admin sees all" ON public.users;

CREATE POLICY "Users can view own row or admin sees all" ON public.users FOR SELECT USING (
  id = auth.uid()
  OR is_admin()
  OR (get_user_tipo_acesso() = 'lider_distrito'::tipo_acesso_enum AND distrito_id IS NOT NULL AND distrito_id = get_user_distrito_id())
  OR (get_user_tipo_acesso() = 'lider_congregacao'::tipo_acesso_enum AND congregacao_id IS NOT NULL AND congregacao_id = get_user_congregacao_id())
);
