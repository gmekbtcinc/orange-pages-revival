
-- Drop existing restrictive policies on memberships
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;

-- Recreate policies using has_admin_role() which includes both super_admin and admin
CREATE POLICY "Admins can view all memberships" 
ON public.memberships 
FOR SELECT 
USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can manage memberships" 
ON public.memberships 
FOR ALL
USING (has_admin_role(auth.uid()));
