ALTER TABLE public.grupos_crescimento
  ADD COLUMN distrito_id uuid REFERENCES public.distritos(id) ON DELETE SET NULL,
  ADD COLUMN congregacao_id uuid REFERENCES public.congregacoes(id) ON DELETE SET NULL;