-- Change default status from 'pendente' to 'aprovado' so new users are auto-approved
ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'aprovado'::status_enum;