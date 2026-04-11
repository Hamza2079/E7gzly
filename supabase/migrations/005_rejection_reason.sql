-- ============================================================
-- 005: Add rejection_reason to providers
-- ============================================================

ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
