-- Ensure authenticated users can update their mobile_number column in public.profiles
GRANT UPDATE (mobile_number) ON public.profiles TO authenticated;
