-- Phase 4: Update ticket_claims table for direct business/profile tracking

-- 1. Add business_id and profile_id columns
ALTER TABLE public.ticket_claims
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Migrate existing data from company_user_id
UPDATE public.ticket_claims tc
SET 
  business_id = cu.business_id,
  profile_id = cu.user_id
FROM public.company_users cu
WHERE tc.company_user_id = cu.id;

-- 3. Add comment marking company_user_id as deprecated
COMMENT ON COLUMN public.ticket_claims.company_user_id IS 'DEPRECATED: Use business_id and profile_id instead. Will be removed in future migration.';

-- 4. Drop old RLS policies
DROP POLICY IF EXISTS "Users can create ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can view their own ticket claims" ON public.ticket_claims;
DROP POLICY IF EXISTS "Users can update their own ticket claims" ON public.ticket_claims;

-- 5. Create new RLS policies using business_id and profile_id with team_memberships

-- Users can view ticket claims for their business (all team members can see company claims)
CREATE POLICY "Team members can view company ticket claims"
  ON public.ticket_claims
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM public.team_memberships WHERE profile_id = auth.uid()
    )
    OR is_super_admin(auth.uid())
  );

-- Users can create ticket claims for their business
CREATE POLICY "Team members can create ticket claims"
  ON public.ticket_claims
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND business_id IN (
      SELECT business_id FROM public.team_memberships WHERE profile_id = auth.uid()
    )
  );

-- Users can update their own ticket claims
CREATE POLICY "Users can update their own ticket claims"
  ON public.ticket_claims
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR is_super_admin(auth.uid())
  );