-- Create profiles table and keep it synced with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "select_profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "insert_own_profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "update_own_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "delete_own_profile" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Keep profiles in sync with auth.users metadata on signup and update
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url)
    VALUES (NEW.id, NEW.user_metadata->>'full_name', NEW.phone, NULL)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET full_name = COALESCE(NEW.user_metadata->>'full_name', profiles.full_name),
        phone = COALESCE(NEW.phone, profiles.phone)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_from_auth_trigger ON auth.users;
CREATE TRIGGER sync_profile_from_auth_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth();
