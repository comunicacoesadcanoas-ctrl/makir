
-- Make user-tracking columns nullable so inserts work without auth
ALTER TABLE public.visitantes ALTER COLUMN cadastrado_por DROP NOT NULL;
ALTER TABLE public.visitantes ALTER COLUMN cadastrado_por_nome DROP NOT NULL;
ALTER TABLE public.discipulos ALTER COLUMN discipulador_id DROP NOT NULL;
ALTER TABLE public.discipulos ALTER COLUMN discipulador_nome DROP NOT NULL;
ALTER TABLE public.relatorios ALTER COLUMN discipulador_id DROP NOT NULL;
ALTER TABLE public.relatorios ALTER COLUMN observacoes DROP NOT NULL;
ALTER TABLE public.frequencia_gc ALTER COLUMN registrado_por DROP NOT NULL;

-- Drop existing restrictive policies and create permissive public policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('visitantes','discipulos','distritos','congregacoes','grupos_crescimento',
                        'membros_gc','licoes','relatorios','frequencia_gc','configuracoes',
                        'notificacoes','solicitacoes_acesso','users')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Public open access to all data tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['visitantes','discipulos','distritos','congregacoes',
                                'grupos_crescimento','membros_gc','licoes','relatorios',
                                'frequencia_gc','configuracoes','notificacoes',
                                'solicitacoes_acesso','users'])
  LOOP
    EXECUTE format('CREATE POLICY "public_all_select" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "public_all_insert" ON public.%I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_all_update" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_all_delete" ON public.%I FOR DELETE USING (true)', t);
  END LOOP;
END $$;
