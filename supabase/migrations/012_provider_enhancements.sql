-- ============================================================
-- 012: Provider Enhancements (Profile & Reviews Updates)
-- Explicitly allows doctors to update their own `providers` row
-- and write responses to their own `reviews`.
-- ============================================================

-- Safely add UPDATE policy for providers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'providers' AND policyname = 'Providers can update their own row'
    ) THEN
        CREATE POLICY "Providers can update their own row" 
        ON public.providers FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;

-- Safely add UPDATE policy for reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Providers can update their own reviews'
    ) THEN
        -- Provider can update (i.e. add a response) if they are the designated provider
        CREATE POLICY "Providers can update their own reviews" 
        ON public.reviews FOR UPDATE USING (provider_id IN (
            SELECT id FROM public.providers WHERE user_id = auth.uid()
        ));
    END IF;
END $$;
