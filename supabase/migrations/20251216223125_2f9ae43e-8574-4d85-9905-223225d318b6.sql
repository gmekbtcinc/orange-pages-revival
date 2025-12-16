-- Fix infinite recursion on admins RLS policies by removing policies that reference the admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins with permission can manage admins" ON public.admins;

-- Keep a simple, non-recursive policy so any logged-in user can check whether THEY are an admin
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admins;
CREATE POLICY "Users can check their own admin status"
ON public.admins
FOR SELECT
USING (auth.uid() = user_id);

-- (Optional safety) Ensure no other actions are allowed from the client by default
-- If you later build an Admin Management UI, we should introduce a separate roles table + security definer functions.
