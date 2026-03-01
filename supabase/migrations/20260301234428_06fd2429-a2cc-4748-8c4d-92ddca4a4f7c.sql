
-- Add tipo_gc and faixa_etaria columns to grupos_crescimento
ALTER TABLE public.grupos_crescimento 
  ADD COLUMN tipo_gc text DEFAULT 'misto',
  ADD COLUMN faixa_etaria text DEFAULT 'adulto';
