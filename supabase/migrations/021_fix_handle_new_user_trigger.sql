-- ============================================================
-- 021: Fix handle_new_user trigger
-- Fixes bug where trigger referenced NEW.app_metadata (does not exist)
-- instead of NEW.raw_app_meta_data on auth.users table.
-- Also adds phone, gender, date_of_birth fields and provider row creation.
-- ============================================================

CREATE OR REPLACE FUNCTION cortex_internal.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Insert the public.users record with all available fields
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    email_verified,
    auth_provider,
    profile_completed,
    phone,
    gender,
    date_of_birth
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
    END,
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::DATE
  );

  -- If it's a provider signup, create the providers row immediately
  IF (NEW.raw_user_meta_data->>'role') = 'provider' THEN
    INSERT INTO public.providers (
      user_id,
      specialty_id,
      license_number,
      bio,
      years_of_experience,
      consultation_fee,
      clinic_name,
      clinic_address,
      city,
      is_verified,
      verification_status,
      slot_duration
    ) VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'specialty_id', '')::UUID,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'license_number', ''), 'PENDING'),
      NEW.raw_user_meta_data->>'bio',
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'years_of_experience', '')::INTEGER, 0),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'consultation_fee', '')::NUMERIC, 0),
      NEW.raw_user_meta_data->>'clinic_name',
      NEW.raw_user_meta_data->>'clinic_address',
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'city', ''), 'Unknown'),
      false,
      'pending',
      30
    );
  END IF;

  RETURN NEW;
END;
$function$;
