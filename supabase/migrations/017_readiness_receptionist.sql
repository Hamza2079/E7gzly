-- ============================================================
-- 017: Flexible Readiness Queue & Receptionist Sessions
-- ============================================================

BEGIN;

-- 1. Add new columns to queue_entries
ALTER TABLE public.queue_entries 
  ADD COLUMN IF NOT EXISTS last_ready_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS defer_count INTEGER NOT NULL DEFAULT 0;

-- 2. Data Migration: Convert 'waiting' to 'ready' or 'not_ready'
UPDATE public.queue_entries
SET 
  status = 'ready',
  last_ready_at = joined_at
WHERE status = 'waiting' AND source = 'walk_in';

UPDATE public.queue_entries
SET status = 'not_ready'
WHERE status = 'waiting' AND source != 'walk_in';

-- 3. Update the check constraint for status
-- Dynamically drop the existing constraint since it might have an auto-generated name
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.queue_entries'::regclass AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%status%';
      
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.queue_entries DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Change default
ALTER TABLE public.queue_entries ALTER COLUMN status SET DEFAULT 'not_ready';

-- Add new constraint
ALTER TABLE public.queue_entries 
  ADD CONSTRAINT queue_entries_status_check 
  CHECK (status IN (
    'ready', 'not_ready', 'called', 'in_progress', 
    'completed', 'cancelled', 'no_show'
  ));

-- 4. Add Receptionist Session columns to queues
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS session_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP WITH TIME ZONE;

COMMIT;
