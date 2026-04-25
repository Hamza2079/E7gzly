-- ============================================================
-- 014: Public Provider Profiles
-- Allows anyone (authenticated or not) to select limited data from the users table 
-- if that user is a 'provider'. This allows directory grids to display doctor names natively.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Anyone can read provider names'
    ) THEN
        CREATE POLICY "Anyone can read provider names" 
        ON public.users FOR SELECT USING (role = 'provider');
    END IF;
END $$;
