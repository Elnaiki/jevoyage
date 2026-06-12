-- Migration: Add email column to profiles table
-- Date: 2026-06-12
-- Purpose: Store email in profiles for easy lookup during login

-- Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the sync_profile_from_auth trigger to include email
DROP FUNCTION IF EXISTS public.sync_profile_from_auth() CASCADE;
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
    VALUES (NEW.id, NEW.user_metadata->>'full_name', NEW.email, NEW.phone, NULL)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET full_name = COALESCE(NEW.user_metadata->>'full_name', profiles.full_name),
        email = COALESCE(NEW.email, profiles.email),
        phone = COALESCE(NEW.phone, profiles.phone)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_profile_from_auth_trigger ON auth.users;
CREATE TRIGGER sync_profile_from_auth_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth();

-- ✓ Email column added
-- ✓ Trigger updated to sync email from auth.users
-- ✓ Index created for email lookups
