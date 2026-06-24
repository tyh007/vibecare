-- Add shop and avatar customization columns to profiles (if not exists)
DO $$ 
BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 50;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_check_in DATE;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_check_ins INTEGER DEFAULT 0;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hairstyle text DEFAULT 'long';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hair_color text DEFAULT 'brown';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eye_color text DEFAULT 'brown_eyes';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS top text DEFAULT 'basic_shirt';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bottom text DEFAULT 'basic_pants';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accessory text DEFAULT 'none';
END $$;

-- Enable realtime for profiles table (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;