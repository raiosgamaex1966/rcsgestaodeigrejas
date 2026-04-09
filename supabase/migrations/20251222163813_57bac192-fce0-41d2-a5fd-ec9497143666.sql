
-- Add email column to profiles for notification purposes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
