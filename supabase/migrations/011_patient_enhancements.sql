-- ============================================================
-- 011: Patient Enhancements
-- Creates the favorites table and patches reviews for queue_entries
-- ============================================================

-- 1. Create Patient Favorites
CREATE TABLE IF NOT EXISTS public.patient_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(patient_id, provider_id)
);

ALTER TABLE public.patient_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favorites are viewable by owner" 
    ON public.patient_favorites FOR SELECT USING (patient_id = auth.uid());
    
CREATE POLICY "Users can insert their own favorites" 
    ON public.patient_favorites FOR INSERT WITH CHECK (patient_id = auth.uid());
    
CREATE POLICY "Users can delete their own favorites" 
    ON public.patient_favorites FOR DELETE USING (patient_id = auth.uid());

-- 2. Ensure Users can update their own profile info
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.users FOR UPDATE USING (id = auth.uid());
    END IF;
END $$;

-- 3. Patch Reviews Table to link with queue_entries instead of the archived appointments
-- We'll rename the column if it exists or add a new one if it doesn't.
DO $$
BEGIN
    -- Only add queue_entry_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'queue_entry_id'
    ) THEN
        ALTER TABLE public.reviews
        ADD COLUMN queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE CASCADE;
    END IF;
    
    -- We can keep appointment_id as nullable for legacy references
    -- No need to explicitly alter unless strict constraints apply, but typically it defaults safely.
END $$;
