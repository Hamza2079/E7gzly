-- ============================================================
-- Run this AFTER 001_user_trigger.sql
-- Adds profile_completed column + updates the trigger
-- ============================================================

-- 1. Add profile_completed column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 2. Mark existing users as profile completed (so they don't get stuck)
UPDATE public.users SET profile_completed = true WHERE profile_completed IS NULL;

-- 3. Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    email_verified,
    auth_provider,
    profile_completed
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.email_confirmed_at IS NOT NULL,
    CASE 
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'
      ELSE 'email'
    END,
    -- Google users must complete profile; email users already filled the form
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN false
      ELSE true
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add RLS policy so users can update their own row
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- 5. Add RLS policy so admins can read all users
DROP POLICY IF EXISTS "admins_read_all_users" ON public.users;
CREATE POLICY "admins_read_all_users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Add RLS policy so admins can update any provider
DROP POLICY IF EXISTS "admins_update_providers" ON public.providers;
CREATE POLICY "admins_update_providers" ON public.providers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Add RLS policy so admins can read all providers (including unverified)
DROP POLICY IF EXISTS "admins_read_all_providers" ON public.providers;
CREATE POLICY "admins_read_all_providers" ON public.providers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Allow authenticated users to insert into providers (for doctor signup)
DROP POLICY IF EXISTS "users_insert_provider" ON public.providers;
CREATE POLICY "users_insert_provider" ON public.providers
  FOR INSERT WITH CHECK (user_id = auth.uid());
