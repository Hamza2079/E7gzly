-- ============================================================
-- 004: Fix infinite recursion in users RLS
-- The admins_read_all_users policy references the users table
-- from WITHIN a users policy = infinite loop.
-- Fix: use a SECURITY DEFINER function to check role.
-- ============================================================

-- Step 1: Create a function that checks if current user is admin
-- SECURITY DEFINER = runs as DB owner, bypasses RLS (no recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Fix the admins policy on users table (this was the broken one)
DROP POLICY IF EXISTS "admins_read_all_users" ON public.users;
CREATE POLICY "admins_read_all_users" ON public.users
  FOR SELECT USING (public.is_admin());

-- Step 3: Also fix the providers admin policies to use the same function
DROP POLICY IF EXISTS "admins_update_providers" ON public.providers;
CREATE POLICY "admins_update_providers" ON public.providers
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admins_read_all_providers" ON public.providers;
CREATE POLICY "admins_read_all_providers" ON public.providers
  FOR SELECT USING (public.is_admin());
