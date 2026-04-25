-- ============================================================
-- 016: Reviews RLS + fix legacy NOT NULL on appointment_id
-- ============================================================

-- Make appointment_id nullable (legacy column from pre-queue system)
ALTER TABLE public.reviews ALTER COLUMN appointment_id DROP NOT NULL;

-- Patients can insert reviews for their own visits
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Patients can insert their own reviews'
    ) THEN
        CREATE POLICY "Patients can insert their own reviews"
        ON public.reviews FOR INSERT WITH CHECK (patient_id = auth.uid());
    END IF;
END $$;

-- Patients can read their own reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Patients can read their own reviews'
    ) THEN
        CREATE POLICY "Patients can read their own reviews"
        ON public.reviews FOR SELECT USING (patient_id = auth.uid());
    END IF;
END $$;

-- Anyone can read reviews (for doctor profiles)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Reviews are publicly readable'
    ) THEN
        CREATE POLICY "Reviews are publicly readable"
        ON public.reviews FOR SELECT USING (true);
    END IF;
END $$;
