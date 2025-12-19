-- =============================================
-- FIX: Update is_business_user to use team_memberships
-- =============================================
--
-- ISSUE:
-- The is_business_user() function checks the OLD company_users table.
-- Users are now in team_memberships, so this always returns false
-- for new users, blocking them from viewing their company's membership tier.
--
-- FIX:
-- Update function to check team_memberships instead.
-- =============================================

CREATE OR REPLACE FUNCTION public.is_business_user(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE profile_id = _user_id
      AND business_id = _business_id
  )
$$;
