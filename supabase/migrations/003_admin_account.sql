-- ============================================================
-- 003: Fix RLS + Create Admin Account
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Fix RLS — Allow users to read AND update their own row
-- The old policy only allowed SELECT for own row, but UPDATE was missing WITH CHECK

DROP POLICY IF EXISTS "users_read_own" ON public.users;
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- STEP 2: Create the admin account
-- This creates a user in auth.users with email/password
-- The trigger will auto-create the public.users row

-- First, check if admin already exists to avoid duplicates
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- Check if admin auth user exists
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@e7gzly.com';
  
  IF admin_uid IS NULL THEN
    -- Create the auth user with email + password (password: Admin@2026!)
    admin_uid := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@e7gzly.com',
      crypt('Admin@2026!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "E7gzly Admin", "role": "admin"}'::jsonb,
      NOW(),
      NOW(),
      '',
      ''
    );

    -- Also insert the identity for email provider
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_uid,
      admin_uid,
      'admin@e7gzly.com',
      jsonb_build_object('sub', admin_uid::text, 'email', 'admin@e7gzly.com'),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Now update the public.users row to be admin
  -- (the trigger may have already created it, or we do it manually)
  IF EXISTS (SELECT 1 FROM public.users WHERE id = admin_uid) THEN
    UPDATE public.users
    SET role = 'admin', profile_completed = true, email_verified = true
    WHERE id = admin_uid;
  ELSE
    INSERT INTO public.users (id, email, full_name, role, profile_completed, email_verified, auth_provider)
    VALUES (admin_uid, 'admin@e7gzly.com', 'E7gzly Admin', 'admin', true, true, 'email');
  END IF;
END $$;
