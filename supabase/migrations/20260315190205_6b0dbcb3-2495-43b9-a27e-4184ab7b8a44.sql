
-- Update visitantes policies
DROP POLICY IF EXISTS "visitantes_select" ON visitantes;
CREATE POLICY "visitantes_select" ON visitantes FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'discipulador' THEN (get_user_congregacao_id() IS NULL OR congregacao_id IS NULL OR congregacao_id = get_user_congregacao_id())
    WHEN 'lider_congregacao' THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito' THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "visitantes_insert" ON visitantes;
CREATE POLICY "visitantes_insert" ON visitantes FOR INSERT WITH CHECK (
  get_user_tipo_acesso() IN ('recepcao', 'lider_congregacao', 'lider_distrito', 'rede')
  AND cadastrado_por = auth.uid()
);

DROP POLICY IF EXISTS "visitantes_update" ON visitantes;
CREATE POLICY "visitantes_update" ON visitantes FOR UPDATE USING (
  CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'lider_congregacao' THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito' THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "visitantes_delete" ON visitantes;
CREATE POLICY "visitantes_delete" ON visitantes FOR DELETE USING (
  CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'lider_congregacao' THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito' THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede' THEN true
    ELSE false
  END
);

-- Update discipulos policies
DROP POLICY IF EXISTS "discipulos_select" ON discipulos;
CREATE POLICY "discipulos_select" ON discipulos FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN (discipulador_id = auth.uid() OR (get_user_congregacao_id() IS NOT NULL AND congregacao_id = get_user_congregacao_id()))
    WHEN 'lider_congregacao' THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito' THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "discipulos_insert" ON discipulos;
CREATE POLICY "discipulos_insert" ON discipulos FOR INSERT WITH CHECK (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);

DROP POLICY IF EXISTS "discipulos_update" ON discipulos;
CREATE POLICY "discipulos_update" ON discipulos FOR UPDATE USING (
  CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'lider_congregacao' THEN (congregacao_id = get_user_congregacao_id())
    WHEN 'lider_distrito' THEN congregacao_in_user_distrito(congregacao_id)
    WHEN 'rede' THEN true
    ELSE false
  END
);

-- Update relatorios policies
DROP POLICY IF EXISTS "relatorios_select" ON relatorios;
CREATE POLICY "relatorios_select" ON relatorios FOR SELECT USING (
  CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'lider_congregacao' THEN EXISTS (
      SELECT 1 FROM discipulos d WHERE d.id = relatorios.discipulo_id AND d.congregacao_id = get_user_congregacao_id()
    )
    WHEN 'lider_distrito' THEN EXISTS (
      SELECT 1 FROM discipulos d WHERE d.id = relatorios.discipulo_id AND congregacao_in_user_distrito(d.congregacao_id)
    )
    WHEN 'rede' THEN true
    ELSE false
  END
);

DROP POLICY IF EXISTS "relatorios_insert" ON relatorios;
CREATE POLICY "relatorios_insert" ON relatorios FOR INSERT WITH CHECK (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
  AND discipulador_id = auth.uid()
);

-- Update GC policies
DROP POLICY IF EXISTS "gc_select" ON grupos_crescimento;
CREATE POLICY "gc_select" ON grupos_crescimento FOR SELECT USING (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);

-- Update users SELECT policy
DROP POLICY IF EXISTS "Users can view own row or admin sees all" ON users;
CREATE POLICY "Users can view own row or admin sees all" ON users FOR SELECT USING (
  id = auth.uid()
  OR is_admin()
  OR (get_user_tipo_acesso() = 'lider_distrito' AND distrito_id IS NOT NULL AND distrito_id = get_user_distrito_id())
  OR (get_user_tipo_acesso() = 'discipulador' AND tipo_acesso IN ('discipulador', 'recepcao') AND (get_user_congregacao_id() IS NULL OR congregacao_id IS NULL OR congregacao_id = get_user_congregacao_id()))
);

-- Update licoes policies
DROP POLICY IF EXISTS "licoes_select" ON licoes;
CREATE POLICY "licoes_select" ON licoes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
      WHEN 'lider_congregacao' THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito' THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede' THEN true
      ELSE false
    END
  )
);

DROP POLICY IF EXISTS "licoes_insert" ON licoes;
CREATE POLICY "licoes_insert" ON licoes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
      WHEN 'lider_congregacao' THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito' THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede' THEN true
      ELSE false
    END
  )
);

DROP POLICY IF EXISTS "licoes_update" ON licoes;
CREATE POLICY "licoes_update" ON licoes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
      WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
      WHEN 'lider_congregacao' THEN d.congregacao_id = get_user_congregacao_id()
      WHEN 'lider_distrito' THEN congregacao_in_user_distrito(d.congregacao_id)
      WHEN 'rede' THEN true
      ELSE false
    END
  )
);

-- Update frequencia_gc policies
DROP POLICY IF EXISTS "frequencia_gc_select" ON frequencia_gc;
CREATE POLICY "frequencia_gc_select" ON frequencia_gc FOR SELECT USING (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);

DROP POLICY IF EXISTS "frequencia_gc_insert" ON frequencia_gc;
CREATE POLICY "frequencia_gc_insert" ON frequencia_gc FOR INSERT WITH CHECK (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);

DROP POLICY IF EXISTS "frequencia_gc_update" ON frequencia_gc;
CREATE POLICY "frequencia_gc_update" ON frequencia_gc FOR UPDATE USING (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);

-- Update membros_gc SELECT
DROP POLICY IF EXISTS "membros_gc_select" ON membros_gc;
CREATE POLICY "membros_gc_select" ON membros_gc FOR SELECT USING (
  get_user_tipo_acesso() IN ('discipulador', 'lider_congregacao', 'lider_distrito', 'rede')
);
