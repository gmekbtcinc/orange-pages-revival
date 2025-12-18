-- Add avatar_url column to company_users for user profile photos
ALTER TABLE public.company_users ADD COLUMN avatar_url text;