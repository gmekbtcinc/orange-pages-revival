-- =============================================
-- FIX: Handle NULL auth.uid() in invitations RLS policy
-- =============================================
--
-- ISSUE:
-- When unauthenticated users query invitations, auth.uid() returns NULL.
-- The subquery and function calls with NULL were causing query errors.
--
-- FIX:
-- Restructure policy to handle unauthenticated case first,
-- and only evaluate authenticated cases when auth.uid() IS NOT NULL.
-- =============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.invitations;

-- Create policy with proper NULL handling
CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT
  USING (
    -- Case 1: Anyone can view pending invitations (for invite accept flow)
    status = 'pending'

    -- Case 2+: Only evaluate if authenticated
    OR (
      auth.uid() IS NOT NULL
      AND (
        -- User's own invitation (case-insensitive email match)
        LOWER(email) = LOWER(auth.email())
        -- Or team admin for this business
        OR is_team_admin(auth.uid(), business_id)
        -- Or super admin
        OR is_super_admin(auth.uid())
      )
    )
  );