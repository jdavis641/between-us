-- Migration: Ensure auto profile creation with email & default alias, and isolate nickname updates via RLS

-- 1. Ensure handle_new_user trigger inserts email and default anonymous_alias & nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_alias TEXT;
BEGIN
  default_alias := COALESCE(
    new.raw_user_meta_data->>'anonymous_alias',
    new.raw_user_meta_data->>'nickname',
    'User_' || substring(new.id::text, 1, 8)
  );

  INSERT INTO public.profiles (id, email, anonymous_alias, nickname)
  VALUES (
    new.id,
    new.email,
    default_alias,
    default_alias
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    anonymous_alias = COALESCE(public.profiles.anonymous_alias, EXCLUDED.anonymous_alias),
    nickname = COALESCE(public.profiles.nickname, EXCLUDED.nickname);

  INSERT INTO public.in_app_messages (user_id, subject, message)
  VALUES (
    new.id,
    'Welcome to your safe space for discovery.',
    'Welcome to Between Us, the premier app designed to enhance intimacy communication, safely discover boundaries, and create mutually fulfilling experiences.

Whether you are single and looking to shortcut the trial-and-error of casual dating, a couple wanting to share desires in a completely non-awkward way, or a married couple keeping the passion alive after years together—you are in the right place.

Our platform is 100% anonymous, entirely judgment-free, and will continuously grow and evolve with your personal interests and preferences.'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Ensure RLS is enabled on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy to allow users to UPDATE their own profile / nickname
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Restrict modifications to the email column:
-- Protect email from modification by authenticated users via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent authenticated users from modifying their email address via profiles update
  IF (auth.uid() IS NOT NULL OR current_user = 'authenticated') AND NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Modification of the email column is restricted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_profile_email_update ON public.profiles;
CREATE TRIGGER tr_prevent_profile_email_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_email_update();

-- 5. Restrict column-level UPDATE privileges for authenticated users
REVOKE UPDATE (email) ON public.profiles FROM authenticated;
GRANT UPDATE (nickname, anonymous_alias, pronouns, base_tolerance, is_active) ON public.profiles TO authenticated;
