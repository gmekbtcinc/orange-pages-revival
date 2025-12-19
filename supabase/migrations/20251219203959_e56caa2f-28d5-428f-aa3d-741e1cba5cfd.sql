-- Drop the trigger that depends on the function first
DROP TRIGGER IF EXISTS trigger_upgrade_on_membership ON public.memberships;

-- Drop triggers on company_users
DROP TRIGGER IF EXISTS update_company_users_updated_at ON public.company_users;

-- Drop the company_users table with CASCADE
DROP TABLE IF EXISTS public.company_users CASCADE;

-- Drop legacy functions
DROP FUNCTION IF EXISTS public.is_company_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_company_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.upgrade_company_users_on_membership();

-- Drop user_invitations if it still exists
DROP TABLE IF EXISTS public.user_invitations CASCADE;