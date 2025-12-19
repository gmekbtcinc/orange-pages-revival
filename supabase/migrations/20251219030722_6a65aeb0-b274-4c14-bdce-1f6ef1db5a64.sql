
-- Disable old signup trigger to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
