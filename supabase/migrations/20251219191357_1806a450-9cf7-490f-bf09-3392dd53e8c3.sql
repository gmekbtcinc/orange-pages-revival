-- =============================================
-- FIX: Overly Permissive RLS Policies (Security Critical)
-- =============================================

-- =============================================
-- FIX 1: INVITATIONS TABLE
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a more restrictive SELECT policy
CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Case 1: Pending, non-expired invitations (for public invite accept flow)
    (status = 'pending' AND (expires_at IS NULL OR expires_at > now()))

    -- Case 2: Authenticated user viewing their own invitation (any status)
    OR (
      auth.uid() IS NOT NULL
      AND email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
    )

    -- Case 3: Team admin viewing invitations for their business
    OR is_team_admin(auth.uid(), business_id)

    -- Case 4: Super admin can view all
    OR is_super_admin(auth.uid())
  );

-- =============================================
-- FIX 2: PASSWORD_RESET_TOKENS TABLE
-- =============================================

-- Drop the dangerously permissive policy
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- Create a policy that blocks ALL client access
CREATE POLICY "No client access to password reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);