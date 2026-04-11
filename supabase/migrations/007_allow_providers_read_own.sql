-- ============================================================
-- 007: Add SELECT and UPDATE policies for providers to see their own row
-- Allows doctors to fetch their own verification status.
-- ============================================================

DROP POLICY IF EXISTS "providers_read_own" ON public.providers;
CREATE POLICY "providers_read_own" ON public.providers
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "providers_update_own" ON public.providers;
CREATE POLICY "providers_update_own" ON public.providers
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
