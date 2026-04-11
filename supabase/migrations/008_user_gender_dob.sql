-- ============================================================
-- 008: Add gender and date_of_birth
-- Adds extra personal fields to the users table
-- ============================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
