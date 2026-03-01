-- Drop all existing RESTRICTIVE policies on users table
DROP POLICY IF EXISTS "Users can view own row or admin sees all" ON public.users;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row or admin updates all" ON public.users;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Users can view own row or admin sees all"
ON public.users FOR SELECT
USING ((id = auth.uid()) OR is_admin());

CREATE POLICY "Users can insert own row"
ON public.users FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own row or admin updates all"
ON public.users FOR UPDATE
USING ((id = auth.uid()) OR is_admin());