-- ============================================================
-- 009: Robust Trigger and Email Sync
-- Syncs email verification from auth.users to public.users
-- Fully handles provider creation on signup securely.
-- ============================================================

-- 1. Sync email verification changes from auth.users to public.users
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.users
    SET email_verified = NEW.email_confirmed_at IS NOT NULL
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verified();


-- 2. Update the new user trigger to suck in all raw metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert the public.users record
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
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN false
      ELSE true
    END,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
  );

  -- If it's a provider signup, create the provider row immediately!
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
      (NEW.raw_user_meta_data->>'specialty_id')::UUID,
      NEW.raw_user_meta_data->>'license_number',
      NEW.raw_user_meta_data->>'bio',
      COALESCE((NEW.raw_user_meta_data->>'years_of_experience')::INTEGER, 0),
      COALESCE((NEW.raw_user_meta_data->>'consultation_fee')::NUMERIC, 0),
      NEW.raw_user_meta_data->>'clinic_name',
      NEW.raw_user_meta_data->>'clinic_address',
      NEW.raw_user_meta_data->>'city',
      false,
      'pending',
      30
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
