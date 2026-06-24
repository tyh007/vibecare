-- Add foreign key relationship between community_messages and profiles
ALTER TABLE public.community_messages 
ADD CONSTRAINT fk_community_messages_profile 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;