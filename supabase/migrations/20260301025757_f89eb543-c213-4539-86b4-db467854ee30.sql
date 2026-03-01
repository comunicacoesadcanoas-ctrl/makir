-- Fix ALL tables: drop RESTRICTIVE policies and recreate as PERMISSIVE

-- ============ CONFIGURACOES ============
DROP POLICY IF EXISTS "configuracoes_insert" ON public.configuracoes;
DROP POLICY IF EXISTS "configuracoes_select" ON public.configuracoes;
DROP POLICY IF EXISTS "configuracoes_update" ON public.configuracoes;

CREATE POLICY "configuracoes_select" ON public.configuracoes FOR SELECT
USING (get_user_tipo_acesso() IS NOT NULL);
CREATE POLICY "configuracoes_insert" ON public.configuracoes FOR INSERT
WITH CHECK (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);
CREATE POLICY "configuracoes_update" ON public.configuracoes FOR UPDATE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- ============ DISCIPULOS ============
DROP POLICY IF EXISTS "discipulos_delete" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_insert" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_select" ON public.discipulos;
DROP POLICY IF EXISTS "discipulos_update" ON public.discipulos;

CREATE POLICY "discipulos_select" ON public.discipulos FOR SELECT
USING (CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "discipulos_insert" ON public.discipulos FOR INSERT
WITH CHECK (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));
CREATE POLICY "discipulos_update" ON public.discipulos FOR UPDATE
USING (CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "discipulos_delete" ON public.discipulos FOR DELETE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- ============ FREQUENCIA_GC ============
DROP POLICY IF EXISTS "frequencia_gc_insert" ON public.frequencia_gc;
DROP POLICY IF EXISTS "frequencia_gc_select" ON public.frequencia_gc;
DROP POLICY IF EXISTS "frequencia_gc_update" ON public.frequencia_gc;

CREATE POLICY "frequencia_gc_select" ON public.frequencia_gc FOR SELECT
USING (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));
CREATE POLICY "frequencia_gc_insert" ON public.frequencia_gc FOR INSERT
WITH CHECK (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));
CREATE POLICY "frequencia_gc_update" ON public.frequencia_gc FOR UPDATE
USING (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));

-- ============ GRUPOS_CRESCIMENTO ============
DROP POLICY IF EXISTS "gc_delete" ON public.grupos_crescimento;
DROP POLICY IF EXISTS "gc_insert" ON public.grupos_crescimento;
DROP POLICY IF EXISTS "gc_select" ON public.grupos_crescimento;
DROP POLICY IF EXISTS "gc_update" ON public.grupos_crescimento;

CREATE POLICY "gc_select" ON public.grupos_crescimento FOR SELECT
USING (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));
CREATE POLICY "gc_insert" ON public.grupos_crescimento FOR INSERT
WITH CHECK (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);
CREATE POLICY "gc_update" ON public.grupos_crescimento FOR UPDATE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);
CREATE POLICY "gc_delete" ON public.grupos_crescimento FOR DELETE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- ============ LICOES ============
DROP POLICY IF EXISTS "licoes_insert" ON public.licoes;
DROP POLICY IF EXISTS "licoes_select" ON public.licoes;
DROP POLICY IF EXISTS "licoes_update" ON public.licoes;

CREATE POLICY "licoes_select" ON public.licoes FOR SELECT
USING (EXISTS (SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
        WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
        WHEN 'rede' THEN true
        ELSE false END));
CREATE POLICY "licoes_insert" ON public.licoes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
        WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
        WHEN 'rede' THEN true
        ELSE false END));
CREATE POLICY "licoes_update" ON public.licoes FOR UPDATE
USING (EXISTS (SELECT 1 FROM discipulos d WHERE d.id = licoes.discipulo_id AND
    CASE get_user_tipo_acesso()
        WHEN 'discipulador' THEN d.discipulador_id = auth.uid()
        WHEN 'rede' THEN true
        ELSE false END));

-- ============ MEMBROS_GC ============
DROP POLICY IF EXISTS "membros_gc_delete" ON public.membros_gc;
DROP POLICY IF EXISTS "membros_gc_insert" ON public.membros_gc;
DROP POLICY IF EXISTS "membros_gc_select" ON public.membros_gc;

CREATE POLICY "membros_gc_select" ON public.membros_gc FOR SELECT
USING (get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum]));
CREATE POLICY "membros_gc_insert" ON public.membros_gc FOR INSERT
WITH CHECK (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);
CREATE POLICY "membros_gc_delete" ON public.membros_gc FOR DELETE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- ============ NOTIFICACOES ============
DROP POLICY IF EXISTS "notificacoes_insert_authenticated" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_select" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_update" ON public.notificacoes;

CREATE POLICY "notificacoes_select" ON public.notificacoes FOR SELECT
USING (usuario_id = auth.uid());
CREATE POLICY "notificacoes_insert_authenticated" ON public.notificacoes FOR INSERT
WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "notificacoes_update" ON public.notificacoes FOR UPDATE
USING (usuario_id = auth.uid());

-- ============ RELATORIOS ============
DROP POLICY IF EXISTS "relatorios_delete" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_insert" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_select" ON public.relatorios;
DROP POLICY IF EXISTS "relatorios_update" ON public.relatorios;

CREATE POLICY "relatorios_select" ON public.relatorios FOR SELECT
USING (CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "relatorios_insert" ON public.relatorios FOR INSERT
WITH CHECK ((get_user_tipo_acesso() = ANY (ARRAY['discipulador'::tipo_acesso_enum, 'rede'::tipo_acesso_enum])) AND discipulador_id = auth.uid());
CREATE POLICY "relatorios_update" ON public.relatorios FOR UPDATE
USING (CASE get_user_tipo_acesso()
    WHEN 'discipulador' THEN discipulador_id = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "relatorios_delete" ON public.relatorios FOR DELETE
USING (get_user_tipo_acesso() = 'rede'::tipo_acesso_enum);

-- ============ SOLICITACOES_ACESSO ============
DROP POLICY IF EXISTS "Admins can update requests" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.solicitacoes_acesso;
DROP POLICY IF EXISTS "Users see own or admin sees all" ON public.solicitacoes_acesso;

CREATE POLICY "Users see own or admin sees all" ON public.solicitacoes_acesso FOR SELECT
USING ((user_id = auth.uid()) OR is_admin());
CREATE POLICY "Users can insert own requests" ON public.solicitacoes_acesso FOR INSERT
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update requests" ON public.solicitacoes_acesso FOR UPDATE
USING (is_admin());

-- ============ VISITANTES ============
DROP POLICY IF EXISTS "visitantes_delete" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_insert" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_select" ON public.visitantes;
DROP POLICY IF EXISTS "visitantes_update" ON public.visitantes;

CREATE POLICY "visitantes_select" ON public.visitantes FOR SELECT
USING (CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'discipulador' THEN true
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "visitantes_insert" ON public.visitantes FOR INSERT
WITH CHECK ((get_user_tipo_acesso() = ANY (ARRAY['recepcao'::tipo_acesso_enum, 'rede'::tipo_acesso_enum])) AND cadastrado_por = auth.uid());
CREATE POLICY "visitantes_update" ON public.visitantes FOR UPDATE
USING (CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);
CREATE POLICY "visitantes_delete" ON public.visitantes FOR DELETE
USING (CASE get_user_tipo_acesso()
    WHEN 'recepcao' THEN cadastrado_por = auth.uid()
    WHEN 'rede' THEN true
    ELSE false END);