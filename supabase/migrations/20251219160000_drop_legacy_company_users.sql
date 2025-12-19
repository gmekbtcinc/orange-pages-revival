-- =============================================
-- CLEANUP: Drop legacy company_users table and related functions
-- =============================================
--
-- CONTEXT:
-- The codebase has migrated from the old user system (company_users)
-- to the new system (profiles + team_memberships + invitations).
--
-- This migration removes the legacy artifacts that are no longer used:
-- - company_users table
-- - is_company_admin function
-- - is_company_user function
-- - upgrade_company_users_on_membership function
-- =============================================

-- Drop triggers on company_users first
DROP TRIGGER IF EXISTS update_company_users_updated_at ON public.company_users;

-- Drop RLS policies on company_users
DROP POLICY IF EXISTS "Users can view their own company user records" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can manage company users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can update company users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can delete company users" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can insert company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can manage all company users" ON public.company_users;

-- Drop the company_users table (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS public.company_users CASCADE;

-- Drop legacy functions
DROP FUNCTION IF EXISTS public.is_company_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_company_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.upgrade_company_users_on_membership();

-- Also drop the user_invitations table if it still exists (should already be dropped)
DROP TABLE IF EXISTS public.user_invitations CASCADE;

-- Log cleanup complete
DO $$
BEGIN
  RAISE NOTICE 'Legacy company_users system has been removed. The new system uses profiles + team_memberships + invitations.';
END $$;
