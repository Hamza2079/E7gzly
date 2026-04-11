-- ============================================================
-- 006: Add INSERT policy for users table
-- Allows users to create their own profile row in case the
-- trigger didn't fire (e.g. they signed up before the trigger
-- was created).
-- ============================================================

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());
