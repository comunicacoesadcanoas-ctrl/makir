CREATE OR REPLACE FUNCTION public.notify_admins_new_user(user_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notificacoes (usuario_id, tipo, mensagem)
  SELECT u.id, 'novo_usuario', 'Novo usuário aguardando aprovação: ' || user_name
  FROM public.users u
  WHERE u.tipo_acesso = 'rede' AND u.status = 'aprovado';
END;
$$;