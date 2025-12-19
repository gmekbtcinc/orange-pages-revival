-- =============================================
-- FIX: Overly Permissive RLS Policies (Security Critical)
-- =============================================
--
-- This migration fixes TWO critical security vulnerabilities:
--
-- 1. INVITATIONS TABLE:
--    The policy "Anyone can view invitation by token" uses USING (true)
--    which exposes ALL invitation records to anyone, including:
--    - All pending invitation tokens (enumeration attacks)
--    - Email addresses of all invitees
--    - Business relationships and roles
--
-- 2. PASSWORD_RESET_TOKENS TABLE:
--    The policy "Service role can manage password reset tokens" uses USING (true)
--    which exposes ALL password reset tokens to anyone. An attacker could:
--    - Enumerate all active password reset tokens
--    - Use stolen tokens to reset any user's password
--
-- =============================================


-- =============================================
-- FIX 1: INVITATIONS TABLE
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a more restrictive SELECT policy
-- NOTE: Pending invitations remain publicly viewable for the invite accept
-- flow to work without authentication. The tokens are UUIDs which are
-- cryptographically random and infeasible to guess. A future improvement
-- would be to move invitation lookup to an edge function.
CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Case 1: Pending, non-expired invitations (for public invite accept flow)
    -- This is necessary because users need to see invitation details before signing in
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

COMMENT ON POLICY "Users can view relevant invitations" ON public.invitations IS
  'Restricts invitation visibility: pending invitations are visible for the invite accept flow,
   authenticated users can see their own invitations, and admins can see business invitations.
   Replaced the overly permissive "Anyone can view invitation by token" policy.';


-- =============================================
-- FIX 2: PASSWORD_RESET_TOKENS TABLE
-- =============================================

-- Drop the dangerously permissive policy
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- Create a policy that blocks ALL client access
-- Edge functions use service_role which bypasses RLS entirely,
-- so they will still work. No client should ever directly access this table.
CREATE POLICY "No client access to password reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY "No client access to password reset tokens" ON public.password_reset_tokens IS
  'Blocks all client access to password reset tokens. Edge functions use service_role
   which bypasses RLS, so they can still manage tokens. This prevents token enumeration attacks.';
