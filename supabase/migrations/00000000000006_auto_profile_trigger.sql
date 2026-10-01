-- Function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);

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

-- Trigger to fire after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
