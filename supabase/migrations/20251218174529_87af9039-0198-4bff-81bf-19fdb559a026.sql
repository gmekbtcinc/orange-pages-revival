-- Make business_id nullable in company_users to allow unlinked users
ALTER TABLE public.company_users ALTER COLUMN business_id DROP NOT NULL;

-- Create function to auto-create company_users record on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if a company_users record already exists for this user
  IF NOT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = NEW.id) THEN
    INSERT INTO public.company_users (
      user_id,
      email,
      display_name,
      business_id,
      role,
      is_active,
      can_claim_tickets,
      can_register_events,
      can_apply_speaking,
      can_edit_profile,
      can_manage_users,
      can_rsvp_dinners,
      can_request_resources
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      NULL,
      'company_user',
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Backfill: Create company_users records for existing auth.users who don't have one
INSERT INTO public.company_users (user_id, email, display_name, business_id, role, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)),
  NULL,
  'company_user',
  true
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_users cu WHERE cu.user_id = au.id
);