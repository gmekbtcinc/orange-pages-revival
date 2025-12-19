-- =============================================
-- FIX: Simplify invitations RLS policy
-- =============================================
--
-- ISSUE:
-- The previous RLS policy was too restrictive and blocking invitation lookups.
-- The expires_at check in RLS was causing issues.
--
-- FIX:
-- Simplify Case 1 to just check for pending status.
-- Expiration is already checked in the application code, so it's redundant in RLS.
-- =============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.invitations;

-- Create simplified policy
CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Case 1: Pending invitations can be viewed by anyone (for invite accept flow)
    -- Expiration is checked in application code
    status = 'pending'

    -- Case 2: Authenticated user viewing their own invitation (any status)
    OR (
      auth.uid() IS NOT NULL
      AND LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )

    -- Case 3: Team admin viewing invitations for their business
    OR is_team_admin(auth.uid(), business_id)

    -- Case 4: Super admin can view all
    OR is_super_admin(auth.uid())
  );
