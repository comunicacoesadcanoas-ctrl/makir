
-- Settings table (singleton row per org)
CREATE TABLE public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_organizacao text NOT NULL DEFAULT 'Minha Igreja',
  cidade_padrao text NOT NULL DEFAULT 'Canoas, RS',
  latitude_padrao double precision DEFAULT -29.9167,
  longitude_padrao double precision DEFAULT -51.1833,
  email_admin text,
  dias_inatividade integer NOT NULL DEFAULT 15,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracoes_select" ON public.configuracoes FOR SELECT
  USING (get_user_tipo_acesso() IS NOT NULL);

CREATE POLICY "configuracoes_update" ON public.configuracoes FOR UPDATE
  USING (get_user_tipo_acesso() = 'rede');

CREATE POLICY "configuracoes_insert" ON public.configuracoes FOR INSERT
  WITH CHECK (get_user_tipo_acesso() = 'rede');

-- Insert default row
INSERT INTO public.configuracoes (nome_organizacao) VALUES ('Minha Igreja');
